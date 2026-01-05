import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { unlink } from 'fs/promises'
import path from 'path'

// GET - Listar arquivos da aula
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const aulaId = searchParams.get('aulaId')

    if (!aulaId) return NextResponse.json({ error: 'Missing aulaId' }, { status: 400 })

    // Verificar acesso
    const aula = await prisma.aulas.findFirst({
        where: { id: aulaId },
        include: { modulos: { include: { cursos: { include: { produtos: true } } } } }
    })

    if (!aula || aula.modulos.cursos.produtos.usuario_id !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const arquivos = await prisma.aula_arquivos.findMany({
        where: { aula_id: aulaId },
        orderBy: { ordem: 'asc' }
    })

    return NextResponse.json(arquivos)
}

// POST - Adicionar arquivo
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { aulaId, nomeOriginal, nomeSalvo, caminhoArquivo, tipoMime, tamanhoBytes } = body

    if (!aulaId || !caminhoArquivo) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    // Verificar acesso
    const aula = await prisma.aulas.findFirst({
        where: { id: aulaId },
        include: { modulos: { include: { cursos: { include: { produtos: true } } } } }
    })

    if (!aula || aula.modulos.cursos.produtos.usuario_id !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const count = await prisma.aula_arquivos.count({ where: { aula_id: aulaId } })

    const arquivo = await prisma.aula_arquivos.create({
        data: {
            id: uuidv4(),
            aula_id: aulaId,
            nome_original: nomeOriginal,
            nome_salvo: nomeSalvo,
            caminho_arquivo: caminhoArquivo,
            tipo_mime: tipoMime,
            tamanho_bytes: tamanhoBytes,
            ordem: count
        }
    })

    return NextResponse.json(arquivo)
}

// DELETE - Remover arquivo
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const arquivoId = searchParams.get('arquivoId')

    if (!arquivoId) return NextResponse.json({ error: 'Missing arquivoId' }, { status: 400 })

    const arquivo = await prisma.aula_arquivos.findFirst({
        where: { id: arquivoId },
        include: { aulas: { include: { modulos: { include: { cursos: { include: { produtos: true } } } } } } }
    })

    if (!arquivo || arquivo.aulas.modulos.cursos.produtos.usuario_id !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Deletar do banco
    await prisma.aula_arquivos.delete({ where: { id: arquivoId } })

    // Tentar deletar físico (opcional, mas bom para limpar)
    try {
        const filePath = path.join(process.cwd(), 'public', arquivo.caminho_arquivo)
        await unlink(filePath)
    } catch (e) {
        console.warn('Falha ao deletar arquivo físico:', e)
    }

    return NextResponse.json({ success: true })
}
