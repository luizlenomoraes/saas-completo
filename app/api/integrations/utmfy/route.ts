import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const integrations = await prisma.utmfy_integrations.findMany({
            where: { usuario_id: session.user.id },
            include: {
                produtos: { select: { id: true, nome: true } }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(integrations)
    } catch (error) {
        console.error('[API Utmfy GET]', error)
        return NextResponse.json({ error: 'Erro ao listar integrações' }, { status: 500 })
    }
}

// POST
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { name, api_token, product_id, events } = body

        if (!name || !api_token) return NextResponse.json({ error: 'Nome e Token são obrigatórios' }, { status: 400 })

        const eventsMap = {
            event_approved: events.includes('approved'),
            event_pending: events.includes('pending'),
            event_rejected: events.includes('rejected'),
            event_refunded: events.includes('refunded'),
            event_charged_back: events.includes('charged_back'),
            event_initiate_checkout: events.includes('initiate_checkout')
        }

        const integration = await prisma.utmfy_integrations.create({
            data: {
                id: uuidv4(),
                usuario_id: session.user.id,
                name,
                api_token,
                product_id: product_id || null,
                ...eventsMap,
                updated_at: new Date()
            }
        })

        return NextResponse.json(integration)
    } catch (error) {
        console.error('[API Utmfy POST]', error)
        return NextResponse.json({ error: 'Erro ao criar integração' }, { status: 500 })
    }
}
