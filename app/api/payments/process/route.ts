import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MercadoPagoGateway } from '@/lib/gateways/mercadopago'
import { PushinPayGateway } from '@/lib/gateways/pushinpay'
import { EfiGateway } from '@/lib/gateways/efi'
import { BeehiveGateway } from '@/lib/gateways/beehive'
import { HypercashGateway } from '@/lib/gateways/hypercash'
import { v4 as uuidv4 } from 'uuid'

// Interface para o payload do checkout
interface CheckoutPayload {
    productId: string  // Este é na verdade o checkout_hash, não o ID
    customer: {
        name: string
        email: string
        cpf: string
        phone: string
    }
    address?: {
        cep: string
        street: string
        number: string
        complement?: string
        neighborhood: string
        city: string
        state: string
    }
    paymentMethod: 'pix' | 'credit_card' | 'boleto'
    orderBumps: string[]
    amount: number
    cardData?: {
        token?: string
        cardNumber?: string
        cardholderName?: string
        cardExpirationMonth?: string
        cardExpirationYear?: string
        securityCode?: string
        installments: number
        identificationType?: string
        identificationNumber?: string
    }
    utm?: {
        source?: string
        medium?: string
        campaign?: string
        content?: string
        term?: string
        src?: string
        sck?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: CheckoutPayload = await request.json()
        const { productId, customer, address, paymentMethod, orderBumps, cardData, utm } = body

        // 1. Buscar produto pelo checkout_hash (não pelo ID direto)
        const produtos: any[] = await prisma.$queryRaw`
            SELECT 
                p.id, p.nome, p.preco, p.gateway, p.checkout_hash,
                u.id as usuario_id, u.mp_access_token, u.pushinpay_token,
                u.efi_client_id, u.efi_client_secret, u.efi_pix_key
            FROM produtos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.checkout_hash = ${productId} OR p.id = ${productId}
        `

        if (produtos.length === 0) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        const product = produtos[0]

        // 2. Calcular valor total (produto + order bumps)
        let totalAmount = Number(product.preco)
        const bumpProducts: { id: string; name: string; price: number }[] = []

        if (orderBumps && orderBumps.length > 0) {
            const bumps: any[] = await prisma.$queryRaw`
                SELECT 
                    ob.id, 
                    op.id as offer_id, op.nome, op.preco
                FROM order_bumps ob
                JOIN produtos op ON ob.offer_product_id = op.id
                WHERE ob.id = ANY(${orderBumps}::text[])
            `

            for (const bump of bumps) {
                totalAmount += Number(bump.preco)
                bumpProducts.push({
                    id: bump.offer_id,
                    name: bump.nome,
                    price: Number(bump.preco),
                })
            }
        }

        // 3. Gerar ID da venda
        const saleId = uuidv4()

        // 4. Criar venda no banco (usando enum correto: 'pending' ao invés de 'pendente')
        await prisma.$executeRaw`
            INSERT INTO vendas (
                id, produto_id, valor, metodo_pagamento, status_pagamento,
                comprador_nome, comprador_email, comprador_cpf, comprador_telefone,
                comprador_cep, comprador_logradouro, comprador_numero,
                comprador_complemento, comprador_bairro, comprador_cidade, comprador_estado,
                utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck,
                data_venda
            ) VALUES (
                ${saleId}, ${product.id}, ${totalAmount}, ${paymentMethod}, 'pending',
                ${customer.name}, ${customer.email}, ${customer.cpf}, ${customer.phone},
                ${address?.cep || null}, ${address?.street || null}, ${address?.number || null},
                ${address?.complement || null}, ${address?.neighborhood || null}, 
                ${address?.city || null}, ${address?.state || null},
                ${utm?.source || null}, ${utm?.medium || null}, ${utm?.campaign || null},
                ${utm?.content || null}, ${utm?.term || null}, ${utm?.src || null}, ${utm?.sck || null},
                NOW()
            )
        `

        // 5. Processar pagamento pelo gateway
        const gateway = product.gateway || 'mercadopago'
        let paymentResult: any

        switch (gateway) {
            case 'mercadopago':
                if (!product.mp_access_token) {
                    throw new Error('Mercado Pago não configurado para este produto')
                }

                let cardToken = cardData?.token

                // Se for cartão de crédito e não tiver token, tokenizar no servidor
                if (paymentMethod === 'credit_card' && !cardToken && cardData?.cardNumber) {
                    // Tokenizar cartão usando API do Mercado Pago
                    const tokenResponse = await fetch(
                        'https://api.mercadopago.com/v1/card_tokens',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${product.mp_access_token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                card_number: cardData.cardNumber,
                                cardholder: {
                                    name: cardData.cardholderName,
                                    identification: {
                                        type: cardData.identificationType || 'CPF',
                                        number: cardData.identificationNumber,
                                    },
                                },
                                expiration_month: parseInt(cardData.cardExpirationMonth || '01'),
                                expiration_year: parseInt('20' + (cardData.cardExpirationYear || '25')),
                                security_code: cardData.securityCode,
                            }),
                        }
                    )

                    if (!tokenResponse.ok) {
                        const tokenError = await tokenResponse.json()
                        console.error('[PAYMENT_PROCESS] Erro ao tokenizar:', tokenError)
                        throw new Error(
                            tokenError.cause?.[0]?.description ||
                            tokenError.message ||
                            'Erro ao processar dados do cartão'
                        )
                    }

                    const tokenData = await tokenResponse.json()
                    cardToken = tokenData.id
                }

                const mpGateway = new MercadoPagoGateway(product.mp_access_token)
                paymentResult = await mpGateway.createPayment({
                    amount: totalAmount,
                    description: product.nome,
                    paymentMethod,
                    customer: {
                        email: customer.email,
                        name: customer.name,
                        cpf: customer.cpf,
                        address: address ? {
                            zip_code: address.cep.replace(/\D/g, ''),
                            street_name: address.street,
                            street_number: address.number,
                            neighborhood: address.neighborhood,
                            city: address.city,
                            federal_unit: address.state
                        } : undefined
                    },
                    externalReference: saleId,
                    cardToken: cardToken,
                    installments: cardData?.installments || 1,
                })
                break



            // TODO: Implementar outros gateways
            case 'pushinpay':
                if (!product.pushinpay_token) {
                    throw new Error('PushinPay não configurado')
                }
                const ppGateway = new PushinPayGateway(product.pushinpay_token)
                paymentResult = await ppGateway.createPayment({
                    amount: totalAmount,
                    paymentMethod: paymentMethod as any, // PushinPay só pix por enquanto
                    customer: {
                        email: customer.email,
                        name: customer.name,
                        cpf: customer.cpf
                    },
                    externalReference: saleId
                })
                break

            case 'efi':
                if (!product.efi_client_id || !product.efi_client_secret || !product.efi_pix_key) {
                    throw new Error('Efí não configurado (Client ID, Secret e Chave Pix obrigatórios)')
                }
                const efiGateway = new EfiGateway({
                    clientId: product.efi_client_id,
                    clientSecret: product.efi_client_secret,
                    pixKey: product.efi_pix_key,
                    certificateName: `cert_${product.usuario_id}.p12` // Convenção de nome
                })
                paymentResult = await efiGateway.createPayment({
                    amount: totalAmount,
                    paymentMethod: paymentMethod as any,
                    customer: {
                        name: customer.name,
                        cpf: customer.cpf
                    },
                    externalReference: saleId
                })
                break

            case 'beehive':
                const beehiveGateway = new BeehiveGateway({ apiToken: 'TODO' })
                paymentResult = await beehiveGateway.createPayment({})
                break

            case 'hypercash':
                const hypercashGateway = new HypercashGateway({ secretKey: 'TODO', publicKey: 'TODO' })
                paymentResult = await hypercashGateway.createPayment({})
                break

            default:
                throw new Error('Gateway não suportado')
        }

        // 6. Atualizar venda com ID do gateway e status adequado
        const dbStatus = paymentResult.status === 'APPROVED'
            ? 'approved'
            : paymentMethod === 'pix'
                ? 'pix_created'
                : 'pending'

        await prisma.$executeRaw`
            UPDATE vendas 
            SET transacao_id = ${paymentResult.paymentId},
                status_pagamento = ${dbStatus}::sale_status
            WHERE id = ${saleId}
        `

        // 7. Retornar resultado
        return NextResponse.json({
            success: true,
            orderId: saleId,
            paymentId: paymentResult.paymentId,
            status: paymentResult.status,
            // Dados específicos por método de pagamento
            ...(paymentMethod === 'pix' && {
                pixData: {
                    qrCode: paymentResult.qrCode,
                    qrCodeBase64: paymentResult.qrCodeBase64,
                    copyPaste: paymentResult.copyPaste,
                    expiresAt: paymentResult.expiresAt,
                },
            }),
            ...(paymentMethod === 'boleto' && {
                boletoData: {
                    barcode: paymentResult.barcode,
                    url: paymentResult.boletoUrl,
                    expiresAt: paymentResult.expiresAt,
                },
            }),
            ...(paymentMethod === 'credit_card' && {
                redirectUrl: `/obrigado?order=${saleId}`,
            }),
        })
    } catch (error: any) {
        console.error('[PAYMENT_PROCESS] Erro:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao processar pagamento' },
            { status: 500 }
        )
    }
}
