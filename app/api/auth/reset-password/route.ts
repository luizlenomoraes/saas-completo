import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { resetPasswordSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validar dados
        const result = resetPasswordSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { token, password } = result.data

        // Buscar usuário com token válido
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date(),
                },
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Token inválido ou expirado' },
                { status: 400 }
            )
        }

        // Hash da nova senha
        const hashedPassword = await hash(password, 12)

        // Atualizar senha e limpar token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        })

        console.log(`[RESET_PASSWORD] Senha redefinida para: ${user.email}`)

        return NextResponse.json({
            success: true,
            message: 'Senha redefinida com sucesso',
        })
    } catch (error) {
        console.error('[RESET_PASSWORD] Erro:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
