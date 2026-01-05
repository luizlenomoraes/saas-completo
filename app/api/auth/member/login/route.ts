import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { signMemberToken } from '@/lib/auth-member'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
        }

        // Hash da senha
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

        // Buscar acesso via Raw Query para garantir compatibilidade se o client não atualizou
        const results: any[] = await prisma.$queryRaw`
            SELECT * FROM alunos_acessos 
            WHERE email_aluno = ${email} 
            AND senha = ${hashedPassword}
            LIMIT 1
        `
        const access = results[0]

        if (!access) {
            return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
        }

        // Autenticado com sucesso
        const token = await signMemberToken({
            email: access.email_aluno,
            sub: access.email_aluno // Identity key
        })

        const response = NextResponse.json({ success: true, redirect: '/members' })

        response.cookies.set('member_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            path: '/'
        })

        return response

    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
    }
}
