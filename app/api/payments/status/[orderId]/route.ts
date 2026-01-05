import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MercadoPagoGateway } from '@/lib/gateways/mercadopago'

export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params

        // Buscar venda com produto e vendedor
        const sale = await prisma.vendas.findUnique({
            where: { id: orderId },
            include: {
                produtos: {
                    include: {
                        usuarios: {
                            select: {
                                mp_access_token: true,
                            },
                        },
                    },
                },
            },
        })

        if (!sale) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        // Mapear status
        const statusMap: Record<string, string> = {
            pendente: 'PENDING',
            aprovado: 'APPROVED',
            rejeitado: 'REJECTED',
            cancelado: 'CANCELLED',
            reembolsado: 'REFUNDED',
            chargeback: 'CHARGED_BACK',
        }

        const currentStatus = statusMap[sale.status_pagamento] || 'PENDING'

        // Se já está aprovado ou rejeitado, retornar direto
        if (['APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED'].includes(currentStatus)) {
            return NextResponse.json({
                orderId: sale.id,
                status: currentStatus,
                productName: sale.produtos.nome,
                amount: Number(sale.valor),
            })
        }

        // Se tem ID do pagamento no gateway, consultar status atualizado
        if (sale.transacao_id && sale.produtos.usuarios.mp_access_token) {
            try {
                const gateway = new MercadoPagoGateway(sale.produtos.usuarios.mp_access_token)
                const { status } = await gateway.getPaymentStatus(sale.transacao_id)

                // Mapear status do gateway para status do banco
                const dbStatusMap: Record<string, string> = {
                    PENDING: 'pendente',
                    APPROVED: 'aprovado',
                    REJECTED: 'rejeitado',
                    CANCELLED: 'cancelado',
                    REFUNDED: 'reembolsado',
                    CHARGED_BACK: 'chargeback',
                }

                const newDbStatus = dbStatusMap[status] || 'pendente'

                // Atualizar status se mudou
                if (newDbStatus !== sale.status_pagamento) {
                    await prisma.vendas.update({
                        where: { id: sale.id },
                        data: {
                            status_pagamento: newDbStatus as any,
                        },
                    })
                }

                return NextResponse.json({
                    orderId: sale.id,
                    status: status,
                    productName: sale.produtos.nome,
                    amount: Number(sale.valor),
                })
            } catch (error) {
                console.error('[PAYMENT_STATUS] Erro ao consultar gateway:', error)
            }
        }

        // Retornar status atual do banco
        return NextResponse.json({
            orderId: sale.id,
            status: currentStatus,
            productName: sale.produtos.nome,
            amount: Number(sale.valor),
        })
    } catch (error: any) {
        console.error('[PAYMENT_STATUS] Erro:', error)
        return NextResponse.json(
            { error: 'Erro ao consultar status' },
            { status: 500 }
        )
    }
}
