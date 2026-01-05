import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { compare, hash } from 'bcryptjs'

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { currentPassword, newPassword, confirmPassword } = body

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'As senhas não coincidem' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres' }, { status: 400 })
        }

        // Buscar usuário atual
        const user = await prisma.usuarios.findUnique({
            where: { id: session.user.id },
            select: { senha: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Verificar senha atual
        const isPasswordValid = await compare(currentPassword, user.senha)
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
        }

        // Hash da nova senha
        const hashedPassword = await hash(newPassword, 10)

        // Atualizar senha
        await prisma.usuarios.update({
            where: { id: session.user.id },
            data: { senha: hashedPassword }
        })

        return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' })
    } catch (error: any) {
        console.error('[API Change Password Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
