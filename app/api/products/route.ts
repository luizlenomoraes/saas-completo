import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { checkSaaSProductLimit } from '@/lib/saas-limits'

// GET - Listar produtos do usuário
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const produtos = await prisma.produtos.findMany({
            where: { usuario_id: session.user.id },
            orderBy: { data_criacao: 'desc' },
            include: {
                cursos: true,
                _count: { select: { vendas: true } }
            }
        })

        return NextResponse.json({ produtos })
    } catch (error: any) {
        console.error('[API Products GET Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar Limite SaaS
        const limitCheck = await checkSaaSProductLimit(session.user.id)
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
        }

        const body = await request.json()
        const { nome, descricao, preco, preco_anterior, tipo_entrega, gateway, foto, conteudo_entrega } = body

        if (!nome || !preco) {
            return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })
        }

        // Gerar hash único para o checkout
        const checkoutHash = `${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`

        const checkoutConfig = JSON.stringify({
            primaryColor: '#32e768',
            showTimer: true,
            timerMinutes: 15,
            showFakeNotifications: true,
            showBanner: false,
            bannerImages: [],
            youtubeVideoId: null,
            backRedirect: true,
            backRedirectMessage: 'Espere! Temos uma oferta especial para você!',
        })

        const produtoId = uuidv4()

        // Usamos a API do Prisma para inserir o produto, garantindo que o enum `tipo_entrega` seja tratado corretamente
        await prisma.produtos.create({
            data: {
                id: produtoId,
                nome,
                descricao: descricao || null,
                preco: parseFloat(preco),
                preco_anterior: preco_anterior ? parseFloat(preco_anterior) : null,
                foto: foto || null,
                checkout_hash: checkoutHash,
                tipo_entrega: tipo_entrega || 'link', // enum value
                conteudo_entrega: conteudo_entrega || null,
                gateway: gateway || 'mercadopago',
                usuario_id: session.user.id,
                checkout_config: checkoutConfig as any, // JSONB
            },
        })

        // Se for área de membros, criar curso automaticamente
        if (tipo_entrega === 'area_membros') {
            const cursoId = uuidv4()
            await prisma.$executeRaw`
                INSERT INTO cursos (id, produto_id, titulo, descricao)
                VALUES (${cursoId}, ${produtoId}, ${nome}, ${descricao || null})
            `
        }

        return NextResponse.json({
            success: true,
            produtoId,
            checkoutHash,
            message: 'Produto criado com sucesso'
        })
    } catch (error: any) {
        console.error('[API Products POST Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
