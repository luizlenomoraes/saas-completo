import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validar dados
        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { name, email, phone, password } = result.data

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            // Se for um membro, permitir atualizar para infoprodutor
            if (existingUser.type === 'MEMBER') {
                // Verificar senha
                const bcrypt = await import('bcryptjs')
                const isPasswordValid = await bcrypt.compare(password, existingUser.password)

                if (!isPasswordValid) {
                    return NextResponse.json(
                        { error: 'Senha incorreta para o email existente' },
                        { status: 400 }
                    )
                }

                // Atualizar para infoprodutor
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        type: 'INFOPRODUCER',
                        name: name || existingUser.name,
                        phone: phone || existingUser.phone,
                    },
                })

                return NextResponse.json({
                    success: true,
                    message: 'Conta atualizada para infoprodutor',
                    upgraded: true,
                })
            }

            return NextResponse.json(
                { error: 'Este email já está cadastrado' },
                { status: 400 }
            )
        }

        // Hash da senha
        const hashedPassword = await hash(password, 12)

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email,
                name,
                phone,
                password: hashedPassword,
                type: 'INFOPRODUCER',
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Conta criada com sucesso',
            userId: user.id,
        })
    } catch (error) {
        console.error('[REGISTER] Erro:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
