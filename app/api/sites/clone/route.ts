import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Listar Sites Clonados
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const sites = await prisma.cloned_sites.findMany({
            where: { usuario_id: session.user.id },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(sites)
    } catch (error) {
        console.error('[API Sites GET]', error)
        return NextResponse.json({ error: 'Erro ao listar sites' }, { status: 500 })
    }
}

// POST - Clonar Site
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { url, slug, title } = body

        if (!url || !slug) return NextResponse.json({ error: 'URL e Slug são obrigatórios' }, { status: 400 })

        // Verificar disponibilidade do Slug
        const slugExists = await prisma.cloned_sites.findFirst({
            where: { slug }
        })

        if (slugExists) {
            return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 400 })
        }

        // Fetch do conteúdo
        let html = ''
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })
            if (!res.ok) throw new Error(`Status ${res.status}`)
            html = await res.text()
        } catch (err: any) {
            return NextResponse.json({ error: `Erro ao acessar URL: ${err.message}` }, { status: 400 })
        }

        // Processamento Básico: Inserir <base>
        // Encontrar <head>
        const headIndex = html.toLowerCase().indexOf('<head>')
        if (headIndex !== -1) {
            // Inserir após <head>
            const insertionPoint = headIndex + 6
            const baseTag = `<base href="${url.endsWith('/') ? url : url + '/'}" />`
            html = html.slice(0, insertionPoint) + baseTag + html.slice(insertionPoint)
        } else {
            // Fallback: tentar inicio
            const baseTag = `<base href="${url}" />`
            html = baseTag + html
        }

        // Salvar
        const site = await prisma.cloned_sites.create({
            data: {
                id: uuidv4(),
                usuario_id: session.user.id,
                original_url: url,
                original_html: html,
                edited_html: html, // Inicialmente igual
                slug,
                title: title || slug,
                status: 'published',
                updated_at: new Date()
            }
        })

        return NextResponse.json(site)

    } catch (error) {
        console.error('[API Sites Clone POST]', error)
        return NextResponse.json({ error: 'Erro ao clonar site' }, { status: 500 })
    }
}
