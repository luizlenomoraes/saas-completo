import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT - Atualizar Webhook
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { url, events, produto_id } = body

        // Verificar propriedade
        const existing = await prisma.webhooks.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 })
        }

        if (url) {
            try { new URL(url) } catch { return NextResponse.json({ error: 'URL inválida' }, { status: 400 }) }
        }

        const eventsMap = events ? {
            event_approved: events.includes('approved'),
            event_pending: events.includes('pending'),
            event_rejected: events.includes('rejected'),
            event_refunded: events.includes('refunded'),
            event_charged_back: events.includes('charged_back')
        } : {}

        const updated = await prisma.webhooks.update({
            where: { id: params.id },
            data: {
                url: url || undefined,
                produto_id: produto_id !== undefined ? (produto_id || null) : undefined,
                ...eventsMap,
                updated_at: new Date()
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('[API Webhooks PUT]', error)
        return NextResponse.json({ error: 'Erro ao atualizar webhook' }, { status: 500 })
    }
}

// DELETE - Remover Webhook
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const existing = await prisma.webhooks.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 })
        }

        await prisma.webhooks.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Webhooks DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir webhook' }, { status: 500 })
    }
}
