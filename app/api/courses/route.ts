import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Buscar curso por produto
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const produtoId = searchParams.get('produtoId')

        if (!produtoId) {
            return NextResponse.json({ error: 'produtoId é obrigatório' }, { status: 400 })
        }

        // Verificar se o produto pertence ao usuário
        const produto = await prisma.produtos.findFirst({
            where: { id: produtoId, usuario_id: session.user.id }
        })

        if (!produto) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        const curso = await prisma.cursos.findFirst({
            where: { produto_id: produtoId },
            include: {
                modulos: {
                    orderBy: { ordem: 'asc' },
                    include: {
                        aulas: {
                            orderBy: { ordem: 'asc' },
                            include: { aula_arquivos: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json({ curso })
    } catch (error: any) {
        console.error('[API Courses GET Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar curso
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { cursoId, titulo, descricao, imagem_url, banner_url } = body

        if (!cursoId) {
            return NextResponse.json({ error: 'cursoId é obrigatório' }, { status: 400 })
        }

        // Verificar se o curso pertence a um produto do usuário
        const curso = await prisma.cursos.findFirst({
            where: { id: cursoId },
            include: { produtos: true }
        })

        if (!curso || curso.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
        }

        await prisma.cursos.update({
            where: { id: cursoId },
            data: {
                titulo: titulo || curso.titulo,
                descricao: descricao !== undefined ? descricao : curso.descricao,
                imagem_url: imagem_url !== undefined ? imagem_url : curso.imagem_url,
                banner_url: banner_url !== undefined ? banner_url : curso.banner_url
            }
        })

        return NextResponse.json({ success: true, message: 'Curso atualizado' })
    } catch (error: any) {
        console.error('[API Courses PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
