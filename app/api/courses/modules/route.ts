import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// POST - Criar módulo
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { cursoId, titulo, release_days } = body

        if (!cursoId || !titulo) {
            return NextResponse.json({ error: 'cursoId e titulo são obrigatórios' }, { status: 400 })
        }

        // Verificar se o curso pertence ao usuário
        const curso = await prisma.cursos.findFirst({
            where: { id: cursoId },
            include: { produtos: true }
        })

        if (!curso || curso.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
        }

        // Buscar a maior ordem atual
        const lastModule = await prisma.modulos.findFirst({
            where: { curso_id: cursoId },
            orderBy: { ordem: 'desc' }
        })

        const novaOrdem = (lastModule?.ordem ?? -1) + 1
        const moduloId = uuidv4()

        await prisma.modulos.create({
            data: {
                id: moduloId,
                curso_id: cursoId,
                titulo,
                ordem: novaOrdem,
                release_days: release_days || 0
            }
        })

        return NextResponse.json({
            success: true,
            moduloId,
            message: 'Módulo criado com sucesso'
        })
    } catch (error: any) {
        console.error('[API Modules POST Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar módulo
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { moduloId, titulo, ordem, release_days, imagem_capa_url } = body

        if (!moduloId) {
            return NextResponse.json({ error: 'moduloId é obrigatório' }, { status: 400 })
        }

        // Verificar se o módulo pertence ao usuário
        const modulo = await prisma.modulos.findFirst({
            where: { id: moduloId },
            include: { cursos: { include: { produtos: true } } }
        })

        if (!modulo || modulo.cursos.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
        }

        await prisma.modulos.update({
            where: { id: moduloId },
            data: {
                titulo: titulo || modulo.titulo,
                ordem: ordem !== undefined ? ordem : modulo.ordem,
                release_days: release_days !== undefined ? release_days : modulo.release_days,
                imagem_capa_url: imagem_capa_url !== undefined ? imagem_capa_url : modulo.imagem_capa_url
            }
        })

        return NextResponse.json({ success: true, message: 'Módulo atualizado' })
    } catch (error: any) {
        console.error('[API Modules PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Excluir módulo
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const moduloId = searchParams.get('moduloId')

        if (!moduloId) {
            return NextResponse.json({ error: 'moduloId é obrigatório' }, { status: 400 })
        }

        // Verificar se o módulo pertence ao usuário
        const modulo = await prisma.modulos.findFirst({
            where: { id: moduloId },
            include: { cursos: { include: { produtos: true } } }
        })

        if (!modulo || modulo.cursos.produtos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
        }

        // Cascade delete vai remover aulas e arquivos
        await prisma.modulos.delete({
            where: { id: moduloId }
        })

        return NextResponse.json({ success: true, message: 'Módulo excluído' })
    } catch (error: any) {
        console.error('[API Modules DELETE Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
