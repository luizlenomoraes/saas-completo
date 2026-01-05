import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const notifications: any[] = await prisma.$queryRaw`
            SELECT id, tipo, mensagem, data_notificacao, lida 
            FROM notificacoes 
            WHERE usuario_id = ${userId} 
            ORDER BY data_notificacao DESC
            LIMIT 50
        `

        return NextResponse.json(notifications)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { notificationIds } = body

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
        }

        if (notificationIds.length > 0) {
            await prisma.$executeRaw`
                UPDATE notificacoes 
                SET lida = true 
                WHERE id IN (${Prisma.join(notificationIds)})
            `
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
