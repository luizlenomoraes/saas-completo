import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { processSaleUpdate } from '@/lib/services/sales-service'

// Interface para o payload do webhook do Mercado Pago
interface MercadoPagoWebhookPayload {
    id: number
    live_mode: boolean
    type: string
    date_created: string
    user_id: string
    api_version: string
    action: string
    data: {
        id: string
    }
}

// Mapear status do Mercado Pago para status do banco
const STATUS_MAP: Record<string, string> = {
    pending: 'pending',
    approved: 'approved',
    authorized: 'approved',
    in_process: 'pending',
    in_mediation: 'pending',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back',
}

export async function POST(request: NextRequest) {
    try {
        const body: MercadoPagoWebhookPayload = await request.json()

        console.log('[WEBHOOK_MP] Recebido:', JSON.stringify(body, null, 2))

        // Ignorar webhooks de teste
        if (body.type === 'test') {
            console.log('[WEBHOOK_MP] Webhook de teste ignorado')
            return NextResponse.json({ received: true })
        }

        // Processar apenas notificações de pagamento
        if (body.type !== 'payment') {
            console.log('[WEBHOOK_MP] Tipo ignorado:', body.type)
            return NextResponse.json({ received: true })
        }

        const paymentId = body.data.id

        if (!paymentId) {
            console.log('[WEBHOOK_MP] ID do pagamento não encontrado')
            return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 })
        }

        // Buscar venda pelo transacao_id (que é o ID do pagamento no MP)
        const vendas: any[] = await prisma.$queryRaw`
            SELECT 
                v.id, v.produto_id, v.status_pagamento, v.comprador_email,
                p.nome as produto_nome, p.tipo_entrega,
                u.mp_access_token
            FROM vendas v
            JOIN produtos p ON v.produto_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE v.transacao_id = ${paymentId}
        `

        if (vendas.length === 0) {
            console.log('[WEBHOOK_MP] Venda não encontrada para payment:', paymentId)
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        const venda = vendas[0]

        // Buscar status atualizado do pagamento no Mercado Pago
        const mpResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${venda.mp_access_token}`,
                },
            }
        )

        if (!mpResponse.ok) {
            console.error('[WEBHOOK_MP] Erro ao buscar pagamento no MP:', mpResponse.status)
            return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
        }

        const paymentData = await mpResponse.json()
        const newStatus = STATUS_MAP[paymentData.status] || 'pending'

        console.log('[WEBHOOK_MP] Status do pagamento:', paymentData.status, '-> DB:', newStatus)

        // Delegar atualização para o serviço centralizado
        // Adicionar campos extras na venda para o webhook (UTMs etc já vêm do select raw se adicionar)
        // Preciso garantir q o select traga tudo

        await processSaleUpdate(venda, newStatus, paymentData, 'mercadopago')

        return NextResponse.json({ received: true, status: newStatus })
    } catch (error: any) {
        console.error('[WEBHOOK_MP] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET para verificar se o webhook está funcionando
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Mercado Pago webhook endpoint is active'
    })
}
