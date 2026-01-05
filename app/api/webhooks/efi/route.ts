import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processSaleUpdate } from '@/lib/services/sales-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('[WEBHOOK_EFI] Recebido:', JSON.stringify(body, null, 2))

        // Documentação Efí: O payload contém uma lista de pix recebidos
        const pixList = body.pix || []

        // Se não tiver lista de pix, pode ser validação do webhook (teste de endpoint)
        if (pixList.length === 0 && !body.evento && !body.pix) {
            return NextResponse.json({ status: 'ok' })
        }

        // Processar cada pix recebido
        for (const pix of pixList) {
            const txid = pix.txid
            const status = 'approved' // Se está na lista de pix recebidos, foi pago (CONCLUIDA)

            // Buscar venda pelo txid
            const vendas: any[] = await prisma.$queryRaw`
                SELECT 
                    v.id, v.produto_id, v.status_pagamento, v.comprador_email, v.comprador_nome, v.comprador_telefone, v.valor,
                    v.utm_source, v.utm_medium, v.utm_campaign, v.src, v.sck,
                    p.nome as produto_nome, p.tipo_entrega
                FROM vendas v
                JOIN produtos p ON v.produto_id = p.id
                WHERE v.transacao_id = ${txid}
            `

            if (vendas.length > 0) {
                const venda = vendas[0]
                await processSaleUpdate(venda, status, pix, 'efi')
            } else {
                console.warn('[WEBHOOK_EFI] Venda não encontrada para txid:', txid)
            }
        }

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('[WEBHOOK_EFI] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
