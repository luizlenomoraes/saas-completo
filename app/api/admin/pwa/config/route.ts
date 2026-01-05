import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const config = await prisma.pwa_config.findFirst()
    return NextResponse.json(config || {})
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { app_name, short_name, theme_color, background_color, vapid_public_key, vapid_private_key } = body

    // Buscar ID existente ou criar novo
    const current = await prisma.pwa_config.findFirst()
    const id = current?.id || uuidv4()

    await prisma.pwa_config.upsert({
        where: { id },
        create: {
            id,
            app_name,
            short_name,
            theme_color,
            background_color,
            vapid_public_key,
            vapid_private_key,
            updated_at: new Date()
        },
        update: {
            app_name,
            short_name,
            theme_color,
            background_color,
            vapid_public_key,
            vapid_private_key,
            updated_at: new Date()
        }
    })

    return NextResponse.json({ success: true })
}
