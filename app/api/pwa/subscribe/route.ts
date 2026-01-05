import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const subscription = await req.json()
        const { endpoint, keys } = subscription

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
        }

        // Verifica se já existe subscription para esse endpoint para evitar duplicatas
        const existing = await prisma.pwa_push_subscriptions.findFirst({
            where: { endpoint: endpoint }
        })

        if (existing) {
            // Atualiza se necessário (as chaves podem ter mudado?)
            await prisma.pwa_push_subscriptions.update({
                where: { id: existing.id },
                data: {
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    updated_at: new Date(),
                    usuario_id: session.user.id // Atualiza dono se mudou
                }
            })
            return NextResponse.json({ success: true, status: 'updated' })
        }

        // Cria nova
        await prisma.pwa_push_subscriptions.create({
            data: {
                id: uuidv4(),
                usuario_id: session.user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                updated_at: new Date()
            }
        })

        return NextResponse.json({ success: true, status: 'created' })
    } catch (e: any) {
        console.error('Subscription API Error:', e)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
