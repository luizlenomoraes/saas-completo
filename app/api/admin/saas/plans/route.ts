import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { saas_period } from '@prisma/client'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const planos = await prisma.saas_planos.findMany({
            orderBy: { ordem: 'asc' }
        })

        return NextResponse.json(planos)
    } catch (error) {
        console.error('[SAAS_PLANS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
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

        if (!nome) {
            return new NextResponse('Nome é obrigatório', { status: 400 })
        }

        const plano = await prisma.saas_planos.create({
            data: {
                id: uuidv4(),
                nome,
                descricao,
                preco: preco || 0,
                periodo: periodo as saas_period || 'mensal',
                max_produtos: max_produtos ? parseInt(max_produtos) : null,
                max_pedidos_mes: max_pedidos_mes ? parseInt(max_pedidos_mes) : null,
                is_free: is_free || false,
                tracking_enabled: tracking_enabled || false,
                ativo: ativo !== undefined ? ativo : true,
                criado_em: new Date(),
                atualizado_em: new Date()
            }
        })

        return NextResponse.json(plano)
    } catch (error) {
        console.error('[SAAS_PLANS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
