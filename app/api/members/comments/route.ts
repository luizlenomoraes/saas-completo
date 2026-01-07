import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyMemberToken } from '@/lib/auth-member'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// LISTAR COMENTÁRIOS
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const aulaId = searchParams.get('aulaId')

    if (!aulaId) return new NextResponse('Aula ID obrigatório', { status: 400 })

    const comentarios = await prisma.aula_comentarios.findMany({
        where: {
            aula_id: aulaId,
            parent_id: null // Pega apenas os comentários raiz primeiro
        },
        include: {
            respostas: {
                include: { usuario: { select: { nome: true, foto_perfil: true, tipo: true } } },
                orderBy: { created_at: 'asc' }
            },
            usuario: { select: { nome: true, foto_perfil: true, tipo: true } }
        },
        orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(comentarios)
}

// CRIAR COMENTÁRIO
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { aulaId, texto, parentId, imagemUrl } = body

        // 1. Tentar identificar como Aluno
        const cookieStore = cookies()
        const memberToken = cookieStore.get('member_session')?.value
        let alunoSession = null

        if (memberToken) {
            alunoSession = await verifyMemberToken(memberToken) as any
        }

        // 2. Tentar identificar como Produtor (Admin)
        const adminSession = await getServerSession(authOptions)

        // Variáveis para salvar
        let alunoEmail = null
        let alunoNome = null
        let usuarioId = null

        if (adminSession?.user) {
            // É um produtor respondendo
            usuarioId = adminSession.user.id
        } else if (alunoSession) {
            // É um aluno comentando
            // Verificar se ele tem acesso a essa aula (segurança extra)
            const aula = await prisma.aulas.findUnique({
                where: { id: aulaId },
                include: { modulos: { include: { cursos: { include: { produtos: true } } } } }
            })

            if (!aula) return new NextResponse('Aula não encontrada', { status: 404 })

            const acesso = await prisma.alunos_acessos.findFirst({
                where: {
                    email_aluno: alunoSession.email,
                    produto_id: aula.modulos.cursos.produto_id
                }
            })

            if (!acesso) return new NextResponse('Sem permissão', { status: 403 })

            alunoEmail = alunoSession.email
            alunoNome = alunoSession.nome || 'Aluno'
        } else {
            return new NextResponse('Não autorizado', { status: 401 })
        }

        const comentario = await prisma.aula_comentarios.create({
            data: {
                aula_id: aulaId,
                texto,
                parent_id: parentId || null,
                imagem_url: imagemUrl || null,
                aluno_email: alunoEmail,
                aluno_nome: alunoNome,
                usuario_id: usuarioId
            }
        })

        return NextResponse.json(comentario)

    } catch (error) {
        console.error(error)
        return new NextResponse('Erro interno', { status: 500 })
    }
}
