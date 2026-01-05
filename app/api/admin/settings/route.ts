import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_KEYS = [
    'system_name',
    'system_url',
    'system_logo',
    'ui_primary_color',
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_from',
    'banner_active',
    'banner_text',
    'banner_color',
    'seo_title_suffix',
    'seo_keywords'
]

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const settings = await prisma.configuracoes_sistema.findMany({
            where: {
                chave: {
                    in: ALLOWED_KEYS
                }
            }
        })

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.chave] = curr.valor
            return acc
        }, {} as Record<string, string | null>)

        return NextResponse.json(settingsMap)
    } catch (error) {
        console.error('[SETTINGS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const settingsToUpdate = Object.entries(body).filter(([key]) => ALLOWED_KEYS.includes(key))

        await prisma.$transaction(
            settingsToUpdate.map(([key, value]) => {
                return prisma.configuracoes_sistema.upsert({
                    where: { chave: key },
                    update: {
                        valor: String(value),
                        updated_at: new Date()
                    },
                    create: {
                        id: uuidv4(),
                        chave: key,
                        valor: String(value),
                        tipo: 'text',
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                })
            })
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[SETTINGS_UPDATE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
