import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const topic = url.searchParams.get('topic') || url.searchParams.get('type')
        const id = url.searchParams.get('id') || url.searchParams.get('data.id')

        if (topic === 'payment' && id) {
            // Buscar credenciais do Gateway Admin
            const gatewayConfig = await prisma.saas_admin_gateways.findUnique({
                where: { gateway: 'mercadopago' }
            })

            if (!gatewayConfig?.mp_access_token) {
                console.error('Webhook SaaS: Gateway não configurado')
                return NextResponse.json({ received: true }) // Retornar 200 para não travar MP
            }

            // Consultar Pagamento no MP
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: {
                    'Authorization': `Bearer ${gatewayConfig.mp_access_token}`
                }
            })

            if (!mpRes.ok) {
                console.error('Webhook SaaS: Erro ao buscar pagamento no MP')
                return NextResponse.json({ received: true })
            }

            const payment = await mpRes.json()
            const assinaturaId = payment.external_reference
            const status = payment.status

            if (assinaturaId && status === 'approved') {
                // Ativar Assinatura
                await prisma.saas_assinaturas.update({
                    where: { id: assinaturaId },
                    data: {
                        status: 'ativo',
                        transacao_id: String(id),
                        atualizado_em: new Date()
                        // Data de vencimento já foi definida na criação (preliminar). 
                        // Futuro: Ajustar data de início real se necessário.
                    }
                })
                console.log(`Assinatura ${assinaturaId} ativada via Webhook SaaS`)
            }
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook SaaS Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
