import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const SAAS_CONFIG_ID = 'saas-main-config'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const config = await prisma.saas_config.findUnique({
            where: { id: SAAS_CONFIG_ID }
        })

        return NextResponse.json(config || { enabled: false })
    } catch (error) {
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
        const { enabled } = body

        const config = await prisma.saas_config.upsert({
            where: { id: SAAS_CONFIG_ID },
            update: {
                enabled,
                updated_at: new Date()
            },
            create: {
                id: SAAS_CONFIG_ID,
                enabled,
                updated_at: new Date()
            }
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error('[SAAS_CONFIG_PUT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
