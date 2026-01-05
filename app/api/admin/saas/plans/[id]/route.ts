import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { saas_period } from '@prisma/client'

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const {
            nome,
            descricao,
            preco,
            periodo,
            max_produtos,
            max_pedidos_mes,
            is_free,
            tracking_enabled,
            ativo
        } = body

        const plano = await prisma.saas_planos.update({
            where: { id: params.id },
            data: {
                nome,
                descricao,
                preco: preco,
                periodo: periodo as saas_period,
                max_produtos: max_produtos ? parseInt(String(max_produtos)) : null,
                max_pedidos_mes: max_pedidos_mes ? parseInt(String(max_pedidos_mes)) : null,
                is_free,
                tracking_enabled,
                ativo,
                atualizado_em: new Date()
            }
        })

        return NextResponse.json(plano)
    } catch (error) {
        console.error('[SAAS_PLAN_UPDATE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Verificar se há assinaturas ativas neste plano antes de deletar?
        // O schema tem onDelete: Cascade nas assinaturas, o que é perigoso mas prático.
        // Vamos permitir cascade, mas idealmente avisaríamos.

        await prisma.saas_planos.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[SAAS_PLAN_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
