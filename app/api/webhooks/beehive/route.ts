import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processSaleUpdate } from '@/lib/services/sales-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('[WEBHOOK_BEEHIVE] Recebido:', JSON.stringify(body))

        // Placeholder: Ajustar campos confore doc da Beehive
        const paymentId = body.id || body.transactionId
        const status = body.status // ex: 'paid'

        if (!paymentId) return NextResponse.json({ error: 'No ID' }, { status: 400 })

        const vendas: any[] = await prisma.$queryRaw`
            SELECT v.*, p.nome as produto_nome, p.tipo_entrega
            FROM vendas v
            JOIN produtos p ON v.produto_id = p.id
            WHERE v.transacao_id = ${paymentId}
        `

        if (vendas.length > 0) {
            const venda = vendas[0]
            // Mapear status
            let newStatus = 'pending'
            if (status === 'paid' || status === 'approved') newStatus = 'approved'
            if (status === 'refunded') newStatus = 'refunded'
            if (status === 'refused') newStatus = 'rejected'

            await processSaleUpdate(venda, newStatus, body, 'beehive')
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
