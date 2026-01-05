import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processSaleUpdate } from '@/lib/services/sales-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('[WEBHOOK_HYPERCASH] Recebido:', JSON.stringify(body))

        // Placeholder
        const paymentId = body.id
        const status = body.status

        if (!paymentId) return NextResponse.json({ error: 'No ID' }, { status: 400 })

        const vendas: any[] = await prisma.$queryRaw`
            SELECT v.*, p.nome as produto_nome, p.tipo_entrega
            FROM vendas v
            JOIN produtos p ON v.produto_id = p.id
            WHERE v.transacao_id = ${paymentId}
        `

        if (vendas.length > 0) {
            const venda = vendas[0]
            let newStatus = 'pending'
            if (status === 'paid' || status === 'approved') newStatus = 'approved'

            await processSaleUpdate(venda, newStatus, body, 'hypercash')
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
