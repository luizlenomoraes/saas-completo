import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Listar Webhooks
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const webhooks = await prisma.webhooks.findMany({
            where: { usuario_id: session.user.id },
            include: {
                produtos: { select: { id: true, nome: true } }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(webhooks)
    } catch (error) {
        console.error('[API Webhooks GET]', error)
        return NextResponse.json({ error: 'Erro ao listar webhooks' }, { status: 500 })
    }
}

// POST - Criar Webhook
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { url, events, produto_id } = body

        if (!url) return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })

        // Validar URL
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
        }

        const eventsMap = {
            event_approved: events.includes('approved'),
            event_pending: events.includes('pending'),
            event_rejected: events.includes('rejected'),
            event_refunded: events.includes('refunded'),
            event_charged_back: events.includes('charged_back')
        }

        const webhook = await prisma.webhooks.create({
            data: {
                id: uuidv4(),
                usuario_id: session.user.id,
                produto_id: produto_id || null, // Se vazio, é global
                url,
                ...eventsMap,
                updated_at: new Date()
            }
        })

        return NextResponse.json(webhook)
    } catch (error) {
        console.error('[API Webhooks POST]', error)
        return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 })
    }
}
