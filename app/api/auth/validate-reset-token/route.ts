import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ valid: false })
        }

        // Buscar usuário com token válido
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date(),
                },
            },
        })

        return NextResponse.json({ valid: !!user })
    } catch (error) {
        console.error('[VALIDATE_RESET_TOKEN] Erro:', error)
        return NextResponse.json({ valid: false })
    }
}
