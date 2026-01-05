import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkSaaSSalesLimit } from '@/lib/saas-limits'

export async function GET(
    request: NextRequest,
    { params }: { params: { hash: string } }
) {
    try {
        const { hash } = params

        if (!hash) {
            return NextResponse.json(
                { error: 'Hash do produto não informado' },
                { status: 400 }
            )
        }

        // Buscar produto pelo hash usando query raw para evitar problemas de nomes
        const produtos: any[] = await prisma.$queryRaw`
            SELECT 
                p.id, p.nome, p.descricao, p.preco, p.preco_anterior, p.foto, 
                p.tipo_entrega, p.gateway, p.checkout_config,
                u.id as usuario_id, u.nome as usuario_nome, u.usuario as usuario_email,
                u.mp_public_key, u.pushinpay_token, u.efi_client_id,
                u.beehive_public_key, u.hypercash_public_key
            FROM produtos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.checkout_hash = ${hash}
        `

        if (produtos.length === 0) {
            return NextResponse.json(
                { error: 'Produto não encontrado' },
                { status: 404 }
            )
        }

        const product = produtos[0]

        // Verificar Limite de Vendas SaaS
        const limitCheck = await checkSaaSSalesLimit(product.usuario_id)
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: 'Este processo de compra está temporariamente indisponível devido aos limites do plano do vendedor.',
                details: limitCheck.reason
            }, { status: 403 })
        }

        // Buscar order bumps
        const orderBumps: any[] = await prisma.$queryRaw`
            SELECT 
                ob.id, ob.headline, ob.description,
                op.id as offer_id, op.nome as offer_nome, op.descricao as offer_descricao,
                op.preco as offer_preco, op.preco_anterior as offer_preco_anterior, op.foto as offer_foto
            FROM order_bumps ob
            JOIN produtos op ON ob.offer_product_id = op.id
            WHERE ob.main_product_id = ${product.id}
            AND ob.is_active = true
            ORDER BY ob.ordem ASC
        `

        // Determinar quais gateways estão disponíveis
        const availableGateways: string[] = []
        const gatewayKeys: Record<string, { publicKey?: string | null }> = {}

        if (product.mp_public_key) {
            availableGateways.push('mercadopago')
            gatewayKeys.mercadopago = { publicKey: product.mp_public_key }
        }
        if (product.pushinpay_token) {
            availableGateways.push('pushinpay')
        }
        if (product.efi_client_id) {
            availableGateways.push('efi')
        }
        if (product.beehive_public_key) {
            availableGateways.push('beehive')
            gatewayKeys.beehive = { publicKey: product.beehive_public_key }
        }
        if (product.hypercash_public_key) {
            availableGateways.push('hypercash')
            gatewayKeys.hypercash = { publicKey: product.hypercash_public_key }
        }

        // Determinar métodos de pagamento disponíveis
        const paymentMethods: string[] = []
        if (availableGateways.length > 0) {
            paymentMethods.push('pix')
            // Cartão disponível em todos exceto pushinpay (só pix)
            if (availableGateways.some(g => g !== 'pushinpay')) {
                paymentMethods.push('credit_card')
            }
            // Boleto disponível apenas em alguns gateways
            if (availableGateways.includes('mercadopago') || availableGateways.includes('efi')) {
                paymentMethods.push('boleto')
            }
        }

        // Parsear configuração do checkout
        const checkoutConfig = (typeof product.checkout_config === 'string'
            ? JSON.parse(product.checkout_config)
            : product.checkout_config) || {}

        // Mapear tipo de entrega
        const deliveryTypeMap: Record<string, string> = {
            'link': 'LINK',
            'email_pdf': 'EMAIL_PDF',
            'area_membros': 'MEMBER_AREA',
            'produto_fisico': 'PHYSICAL',
        }

        // Formatar order bumps
        const formattedBumps = orderBumps.map((ob) => ({
            id: ob.id,
            headline: ob.headline,
            description: ob.description,
            product: {
                id: ob.offer_id,
                name: ob.offer_nome,
                description: ob.offer_descricao,
                price: Number(ob.offer_preco),
                previousPrice: ob.offer_preco_anterior ? Number(ob.offer_preco_anterior) : null,
                image: ob.offer_foto,
            },
        }))

        // Retornar dados do produto
        return NextResponse.json({
            success: true,
            product: {
                id: product.id,
                name: product.nome,
                description: product.descricao,
                price: Number(product.preco),
                previousPrice: product.preco_anterior ? Number(product.preco_anterior) : null,
                image: product.foto,
                deliveryType: deliveryTypeMap[product.tipo_entrega] || product.tipo_entrega,
                gateway: product.gateway,
            },
            seller: {
                id: product.usuario_id,
                name: product.usuario_nome,
            },
            orderBumps: formattedBumps,
            availableGateways,
            gatewayKeys,
            paymentMethods,
            checkoutConfig: {
                primaryColor: checkoutConfig.primaryColor || '#22c55e',
                backgroundColor: checkoutConfig.backgroundColor || '#ffffff',
                textColor: checkoutConfig.textColor || '#09090b',
                logoUrl: checkoutConfig.logoUrl || null,
                timerEnabled: (checkoutConfig.timerEnabled ?? checkoutConfig.showTimer) ?? false,
                timerDuration: (checkoutConfig.timerDuration ?? checkoutConfig.timerMinutes) || 15,
                askPhone: checkoutConfig.askPhone ?? true,
                askCpf: checkoutConfig.askCpf ?? true,
                socialProofEnabled: (checkoutConfig.socialProofEnabled ?? checkoutConfig.showFakeNotifications) ?? false,

                // Manter compatibilidade se precisar, ou remover
                showBanner: checkoutConfig.showBanner ?? false,
                bannerImages: checkoutConfig.bannerImages || [],
                youtubeVideoId: checkoutConfig.youtubeVideoId || null,
                backRedirect: checkoutConfig.backRedirect ?? false,
                backRedirectMessage: checkoutConfig.backRedirectMessage || 'Espere! Temos uma oferta especial para você!',
            },
        })
    } catch (error) {
        console.error('[CHECKOUT_API] Erro:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
