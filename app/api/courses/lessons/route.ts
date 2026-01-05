import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// POST - Criar aula
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { moduloId, titulo, url_video, descricao, release_days, tipo_conteudo } = body

        if (!moduloId || !titulo) {
            return NextResponse.json({ error: 'moduloId e titulo são obrigatórios' }, { status: 400 })
        }

        // Verificar se o módulo pertence ao usuário
        const modulo = await prisma.modulos.findFirst({
            where: { id: moduloId },
            include: { cursos: { include: { produtos: true } } }
        })

        if (!modulo || modulo.cursos.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
        }

        // Buscar a maior ordem atual
        const lastLesson = await prisma.aulas.findFirst({
            where: { modulo_id: moduloId },
            orderBy: { ordem: 'desc' }
        })

        const novaOrdem = (lastLesson?.ordem ?? -1) + 1
        const aulaId = uuidv4()

        await prisma.aulas.create({
            data: {
                id: aulaId,
                modulo_id: moduloId,
                titulo,
                url_video: url_video || null,
                descricao: descricao || null,
                ordem: novaOrdem,
                release_days: release_days || 0,
                tipo_conteudo: tipo_conteudo || 'video'
            }
        })

        return NextResponse.json({
            success: true,
            aulaId,
            message: 'Aula criada com sucesso'
        })
    } catch (error: any) {
        console.error('[API Lessons POST Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar aula
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { aulaId, titulo, url_video, descricao, ordem, release_days, tipo_conteudo } = body

        if (!aulaId) {
            return NextResponse.json({ error: 'aulaId é obrigatório' }, { status: 400 })
        }

        // Verificar se a aula pertence ao usuário
        const aula = await prisma.aulas.findFirst({
            where: { id: aulaId },
            include: { modulos: { include: { cursos: { include: { produtos: true } } } } }
        })

        if (!aula || aula.modulos.cursos.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
        }

        await prisma.aulas.update({
            where: { id: aulaId },
            data: {
                titulo: titulo || aula.titulo,
                url_video: url_video !== undefined ? url_video : aula.url_video,
                descricao: descricao !== undefined ? descricao : aula.descricao,
                ordem: ordem !== undefined ? ordem : aula.ordem,
                release_days: release_days !== undefined ? release_days : aula.release_days,
                tipo_conteudo: tipo_conteudo || aula.tipo_conteudo
            }
        })

        return NextResponse.json({ success: true, message: 'Aula atualizada' })
    } catch (error: any) {
        console.error('[API Lessons PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Excluir aula
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const aulaId = searchParams.get('aulaId')

        if (!aulaId) {
            return NextResponse.json({ error: 'aulaId é obrigatório' }, { status: 400 })
        }

        // Verificar se a aula pertence ao usuário
        const aula = await prisma.aulas.findFirst({
            where: { id: aulaId },
            include: { modulos: { include: { cursos: { include: { produtos: true } } } } }
        })

        if (!aula || aula.modulos.cursos.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
        }

        // Cascade delete vai remover arquivos e progresso
        await prisma.aulas.delete({
            where: { id: aulaId }
        })

        return NextResponse.json({ success: true, message: 'Aula excluída' })
    } catch (error: any) {
        console.error('[API Lessons DELETE Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
