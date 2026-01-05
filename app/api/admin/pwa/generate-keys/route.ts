import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import webpush from 'web-push'

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const keys = webpush.generateVAPIDKeys()
    return NextResponse.json(keys)
}
