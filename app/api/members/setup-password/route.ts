import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { token, password, confirmPassword } = await request.json()

        if (!token || !password || !confirmPassword) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'As senhas não coincidem' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 })
        }

        // Buscar acesso pelo token de setup (usando uma abordagem simples via email criptografado)
        // O token seria uma combinação de email_hash + produto_id_hash
        // Vamos assumir que o token é base64(email:produtoId)
        let email: string
        let produtoId: string

        try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8')
            const parts = decoded.split(':')
            if (parts.length !== 2) throw new Error('Token inválido')
            email = parts[0]
            produtoId = parts[1]
        } catch {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
        }

        // Verificar se o acesso existe
        const access: any[] = await prisma.$queryRaw`
            SELECT id, senha FROM alunos_acessos
            WHERE email_aluno = ${email}
            AND produto_id = ${produtoId}
        `

        if (access.length === 0) {
            return NextResponse.json({ error: 'Acesso não encontrado' }, { status: 404 })
        }

        // Verificar se já tem senha configurada
        if (access[0].senha) {
            return NextResponse.json({ error: 'A senha já foi configurada. Use o login normal.' }, { status: 400 })
        }

        // Hash da senha usando SHA256 (mesmo padrão do seed-access.ts)
        const senhaHash = crypto.createHash('sha256').update(password).digest('hex')

        // Atualizar senha
        await prisma.$executeRaw`
            UPDATE alunos_acessos
            SET senha = ${senhaHash}
            WHERE email_aluno = ${email}
            AND produto_id = ${produtoId}
        `

        return NextResponse.json({
            success: true,
            message: 'Senha configurada com sucesso! Você já pode fazer login.'
        })
    } catch (error: any) {
        console.error('[API Setup Password Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// GET - Verificar se o token é válido
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ valid: false, error: 'Token não fornecido' }, { status: 400 })
        }

        let email: string
        let produtoId: string

        try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8')
            const parts = decoded.split(':')
            if (parts.length !== 2) throw new Error('Token inválido')
            email = parts[0]
            produtoId = parts[1]
        } catch {
            return NextResponse.json({ valid: false, error: 'Token inválido' }, { status: 400 })
        }

        // Verificar se o acesso existe e não tem senha
        const access: any[] = await prisma.$queryRaw`
            SELECT id, senha FROM alunos_acessos
            WHERE email_aluno = ${email}
            AND produto_id = ${produtoId}
        `

        if (access.length === 0) {
            return NextResponse.json({ valid: false, error: 'Acesso não encontrado' }, { status: 404 })
        }

        if (access[0].senha) {
            return NextResponse.json({
                valid: false,
                error: 'A senha já foi configurada',
                alreadySetup: true
            })
        }

        // Buscar nome do produto para exibir na página
        const produto = await prisma.produtos.findUnique({
            where: { id: produtoId },
            select: { nome: true }
        })

        return NextResponse.json({
            valid: true,
            email,
            produtoNome: produto?.nome || 'Produto'
        })
    } catch (error: any) {
        console.error('[API Setup Password GET Error]', error)
        return NextResponse.json({ valid: false, error: 'Erro interno' }, { status: 500 })
    }
}
