import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { planId, method } = body

        if (!planId) return new NextResponse('Plan ID missing', { status: 400 })

        const plano = await prisma.saas_planos.findUnique({
            where: { id: planId }
        })

        if (!plano || !plano.ativo) {
            return new NextResponse('Plano inválido', { status: 400 })
        }

        // Lógica para Plano Gratuito
        if (plano.is_free) {
            // Verificar se usuário já tem assinatura ativa desse plano?
            // Vamos permitir reativar.

            const now = new Date()
            const vencimento = new Date(now)
            // Plano grátis vitalício ou renovável? Vamos colocar 100 anos ou renovação mensal automática.
            // Para lógica de limites, melhor mensal renovando.
            vencimento.setMonth(vencimento.getMonth() + 1)

            const assinatura = await prisma.saas_assinaturas.create({
                data: {
                    id: uuidv4(),
                    usuario_id: session.user.id,
                    plano_id: plano.id,
                    status: 'ativo',
                    data_inicio: now,
                    data_vencimento: vencimento,
                    renovacao_automatica: true,
                    atualizado_em: now
                }
            })

            // Atualizar flag no usuário se necessário
            await prisma.usuarios.update({
                where: { id: session.user.id },
                data: {
                    saas_plano_free_atribuido: true,
                    updatedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, subscriptionId: assinatura.id })
        }

        // Lógica para Plano Pago
        // 1. Buscar Gateway Config
        const gatewayConfig = await prisma.saas_admin_gateways.findUnique({
            where: { gateway: 'mercadopago' }
        })

        if (!gatewayConfig || !gatewayConfig.mp_access_token) {
            return NextResponse.json({ error: 'Gateway de pagamento não configurado pelo administrador.' }, { status: 400 })
        }

        // 2. Criar Assinatura Pendente
        const now = new Date()
        const vencimento = new Date(now)
        if (plano.periodo === 'mensal') vencimento.setMonth(vencimento.getMonth() + 1)
        else vencimento.setFullYear(vencimento.getFullYear() + 1)

        const assinaturaId = uuidv4()

        await prisma.saas_assinaturas.create({
            data: {
                id: assinaturaId,
                usuario_id: session.user.id,
                plano_id: plano.id,
                status: 'pendente',
                data_inicio: now,
                data_vencimento: vencimento, // Preliminar
                metodo_pagamento: method,
                gateway: 'mercadopago',
                atualizado_em: now
            }
        })

        // 3. Criar Preferência no MP
        const preferenceData = {
            items: [
                {
                    title: `Assinatura ${plano.nome} (${plano.periodo})`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: Number(plano.preco)
                }
            ],
            payer: {
                email: session.user.email
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`,
                failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscribe/${planId}?status=failure`,
                pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscribe/${planId}?status=pending`
            },
            external_reference: assinaturaId,
            metadata: {
                subscription_id: assinaturaId,
                type: 'saas_subscription'
            },
            auto_return: 'approved'
        }

        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayConfig.mp_access_token}`
            },
            body: JSON.stringify(preferenceData)
        })

        const mpData = await mpRes.json()

        if (!mpRes.ok) {
            console.error('MP Error', mpData)
            throw new Error('Erro ao comunicar com Mercado Pago')
        }

        return NextResponse.json({ url: mpData.init_point })

    } catch (error) {
        console.error('[SAAS_CHECKOUT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
