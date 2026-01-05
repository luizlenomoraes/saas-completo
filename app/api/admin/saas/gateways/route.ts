import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.type !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const config = await prisma.saas_admin_gateways.findUnique({
            where: { gateway: 'mercadopago' }
        })

        return NextResponse.json(config || {})
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
        const { gateway, mp_access_token } = body

        if (gateway !== 'mercadopago') {
            return new NextResponse('Gateway not supported', { status: 400 })
        }

        const config = await prisma.saas_admin_gateways.upsert({
            where: { gateway: 'mercadopago' },
            update: {
                mp_access_token,
                updated_at: new Date()
            },
            create: {
                id: uuidv4(),
                gateway: 'mercadopago',
                mp_access_token,
                updated_at: new Date()
            }
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error('[SAAS_GATEWAYS_PUT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
