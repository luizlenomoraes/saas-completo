import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validations'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validar email
        const result = forgotPasswordSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email } = result.data

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // Por segurança, sempre retornar sucesso mesmo se email não existir
        if (!user) {
            console.log(`[FORGOT_PASSWORD] Email não encontrado: ${email}`)
            return NextResponse.json({
                success: true,
                message: 'Se o email existir, você receberá as instruções.',
            })
        }

        // Gerar token aleatório
        const resetToken = randomBytes(32).toString('hex')

        // Token expira em 1 hora
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1)

        // Salvar token no banco
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: expiresAt,
            },
        })

        // Enviar email
        const emailSent = await sendPasswordResetEmail(
            email,
            user.name || 'Usuário',
            resetToken
        )

        if (!emailSent) {
            console.error(`[FORGOT_PASSWORD] Falha ao enviar email para: ${email}`)
        }

        console.log(`[FORGOT_PASSWORD] Token gerado para: ${email}`)

        return NextResponse.json({
            success: true,
            message: 'Se o email existir, você receberá as instruções.',
        })
    } catch (error) {
        console.error('[FORGOT_PASSWORD] Erro:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
