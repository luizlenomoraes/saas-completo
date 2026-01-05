import { NextRequest, NextResponse } from 'next/server'
import { verifyMemberToken } from '@/lib/auth-member'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Buscar progresso do aluno
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('member_session')?.value
        const session: any = token ? await verifyMemberToken(token) : null

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const produtoId = searchParams.get('produtoId')

        if (!produtoId) {
            return NextResponse.json({ error: 'produtoId é obrigatório' }, { status: 400 })
        }

        // Buscar todas as aulas concluídas deste aluno para este produto
        const progresso = await prisma.$queryRaw`
            SELECT ap.aula_id, ap.data_conclusao
            FROM aluno_progresso ap
            INNER JOIN aulas a ON a.id = ap.aula_id
            INNER JOIN modulos m ON m.id = a.modulo_id
            INNER JOIN cursos c ON c.id = m.curso_id
            WHERE ap.aluno_email = ${session.email}
            AND c.produto_id = ${produtoId}
        `

        return NextResponse.json({ progresso })
    } catch (error: any) {
        console.error('[API Progress GET Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Marcar aula como concluída
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('member_session')?.value
        const session: any = token ? await verifyMemberToken(token) : null

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { aulaId } = await request.json()

        if (!aulaId) {
            return NextResponse.json({ error: 'aulaId é obrigatório' }, { status: 400 })
        }

        // Verificar se a aula existe
        const aula = await prisma.aulas.findUnique({
            where: { id: aulaId },
            include: { modulos: { include: { cursos: true } } }
        })

        if (!aula) {
            return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
        }

        // Verificar se o aluno tem acesso ao produto
        const produtoId = aula.modulos.cursos.produto_id
        const access: any[] = await prisma.$queryRaw`
            SELECT id FROM alunos_acessos
            WHERE email_aluno = ${session.email}
            AND produto_id = ${produtoId}
        `

        if (access.length === 0) {
            return NextResponse.json({ error: 'Sem acesso ao curso' }, { status: 403 })
        }

        // Inserir ou atualizar progresso (upsert via raw por causa do @unique constraint)
        const progressId = uuidv4()
        await prisma.$executeRaw`
            INSERT INTO aluno_progresso (id, aluno_email, aula_id, data_conclusao)
            VALUES (${progressId}, ${session.email}, ${aulaId}, NOW())
            ON CONFLICT (aluno_email, aula_id) DO NOTHING
        `

        return NextResponse.json({ success: true, message: 'Aula marcada como concluída' })
    } catch (error: any) {
        console.error('[API Progress POST Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Remover progresso (desmarcar como concluída)
export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('member_session')?.value
        const session: any = token ? await verifyMemberToken(token) : null

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const aulaId = searchParams.get('aulaId')

        if (!aulaId) {
            return NextResponse.json({ error: 'aulaId é obrigatório' }, { status: 400 })
        }

        await prisma.$executeRaw`
            DELETE FROM aluno_progresso
            WHERE aluno_email = ${session.email}
            AND aula_id = ${aulaId}
        `

        return NextResponse.json({ success: true, message: 'Progresso removido' })
    } catch (error: any) {
        console.error('[API Progress DELETE Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
