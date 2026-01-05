import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processSaleUpdate } from '@/lib/services/sales-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('[WEBHOOK_PUSHINPAY] Recebido:', JSON.stringify(body, null, 2))

        // Extrair ID e Status (ajustar conforme payload real da PushinPay)
        // Geralmente: { id: "...", status: "paid" }
        const paymentId = body.id || body.transaction_id
        const status = body.status

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 })
        }

        // Buscar venda pelo transacao_id
        const vendas: any[] = await prisma.$queryRaw`
            SELECT 
                v.id, v.produto_id, v.status_pagamento, v.comprador_email, v.comprador_nome, v.comprador_telefone, v.valor,
                v.utm_source, v.utm_medium, v.utm_campaign, v.src, v.sck,
                p.nome as produto_nome, p.tipo_entrega
            FROM vendas v
            JOIN produtos p ON v.produto_id = p.id
            WHERE v.transacao_id = ${paymentId}
        `

        if (vendas.length === 0) {
            // Se não achou pelo ID da transação, verificar se mandaram a referência externa (nosso ID de venda)
            // Payload pode ter "external_reference"
            const externalRef = body.external_reference
            if (externalRef) {
                const vendasRef: any[] = await prisma.$queryRaw`
                    SELECT 
                        v.id, v.produto_id, v.status_pagamento, v.comprador_email, v.comprador_nome, v.comprador_telefone, v.valor,
                        v.utm_source, v.utm_medium, v.utm_campaign, v.src, v.sck,
                        p.nome as produto_nome, p.tipo_entrega
                    FROM vendas v
                    JOIN produtos p ON v.produto_id = p.id
                    WHERE v.id = ${externalRef}
                `
                if (vendasRef.length > 0) {
                    const venda = vendasRef[0]
                    const statusMap: Record<string, string> = {
                        paid: 'approved',
                        approved: 'approved',
                        pending: 'pending',
                        expired: 'cancelled',
                        canceled: 'cancelled',
                        refunded: 'refunded'
                    }
                    const newStatus = statusMap[status] || 'pending'

                    // Atualizar transacao_id se estava faltando e processar
                    if (!venda.transacao_id) {
                        await prisma.$executeRaw`UPDATE vendas SET transacao_id = ${paymentId} WHERE id = ${venda.id}`
                    }

                    await processSaleUpdate(venda, newStatus, body, 'pushinpay')
                    return NextResponse.json({ received: true })
                }
            }

            console.log('[WEBHOOK_PUSHINPAY] Venda não encontrada:', paymentId)
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        const venda = vendas[0]

        // Mapear status
        const statusMap: Record<string, string> = {
            paid: 'approved',
            approved: 'approved',
            pending: 'pending',
            expired: 'cancelled',
            canceled: 'cancelled',
            refunded: 'refunded'
        }

        const newStatus = statusMap[status] || 'pending'

        await processSaleUpdate(venda, newStatus, body, 'pushinpay')

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('[WEBHOOK_PUSHINPAY] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
