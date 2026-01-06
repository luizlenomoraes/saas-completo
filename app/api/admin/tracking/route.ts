import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const settings = await prisma.tracking_pixels.findUnique({
            where: {
                usuario_id: session.user.id
            }
        })

        return NextResponse.json(settings || {})
    } catch (error) {
        console.error('[TRACKING_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const {
            facebook_pixel_id,
            google_analytics_id,
            tiktok_pixel_id,
            kwai_pixel_id,
            pinterest_pixel_id,
            taboola_pixel_id,
            linkedin_pixel_id
        } = body

        const settings = await prisma.tracking_pixels.upsert({
            where: {
                usuario_id: session.user.id
            },
            update: {
                facebook_pixel_id,
                google_analytics_id,
                tiktok_pixel_id,
                kwai_pixel_id,
                pinterest_pixel_id,
                taboola_pixel_id,
                linkedin_pixel_id,
                updated_at: new Date()
            },
            create: {
                id: uuidv4(),
                usuario_id: session.user.id,
                facebook_pixel_id,
                google_analytics_id,
                tiktok_pixel_id,
                kwai_pixel_id,
                pinterest_pixel_id,
                taboola_pixel_id,
                linkedin_pixel_id,
                updated_at: new Date()
            }
        })

        return NextResponse.json(settings)
    } catch (error) {
        console.error('[TRACKING_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
