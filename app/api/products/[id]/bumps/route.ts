import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Listar Order Bumps do Produto
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar propriedade do produto principal
        const produto = await prisma.produtos.findFirst({
            where: { id: params.id, usuario_id: session.user.id }
        })

        if (!produto) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        const bumps = await prisma.order_bumps.findMany({
            where: { main_product_id: params.id },
            include: {
                produtos_order_bumps_offer_product_idToprodutos: {
                    select: { id: true, nome: true, preco: true, foto: true }
                }
            },
            orderBy: { ordem: 'asc' }
        })

        // Mapear para nome mais amigável para o frontend
        const savedBumps = bumps.map(bump => ({
            id: bump.id,
            main_product_id: bump.main_product_id,
            offer_product_id: bump.offer_product_id,
            headline: bump.headline,
            description: bump.description,
            ordem: bump.ordem,
            is_active: bump.is_active,
            offer_product: bump.produtos_order_bumps_offer_product_idToprodutos
        }))

        return NextResponse.json(savedBumps)
    } catch (error) {
        console.error('[API Bumps GET]', error)
        return NextResponse.json({ error: 'Erro ao listar bumps' }, { status: 500 })
    }
}

// POST - Criar Order Bump
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { offerProductId, headline, description } = body

        if (!offerProductId || !headline) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        // Verificar propriedade do produto principal
        const mainProduct = await prisma.produtos.findFirst({
            where: { id: params.id, usuario_id: session.user.id }
        })

        if (!mainProduct) return NextResponse.json({ error: 'Produto principal não encontrado' }, { status: 404 })

        // Verificar propriedade do produto oferta
        const offerProduct = await prisma.produtos.findFirst({
            where: { id: offerProductId, usuario_id: session.user.id }
        })

        if (!offerProduct) return NextResponse.json({ error: 'Produto oferta não encontrado' }, { status: 404 })

        // Verificar se já existe (evitar duplicata do mesmo par)
        const exists = await prisma.order_bumps.findFirst({
            where: { main_product_id: params.id, offer_product_id: offerProductId }
        })

        if (exists) return NextResponse.json({ error: 'Este produto já é um order bump para este produto' }, { status: 400 })

        // Contar para ordem
        const count = await prisma.order_bumps.count({ where: { main_product_id: params.id } })

        const bump = await prisma.order_bumps.create({
            data: {
                id: uuidv4(),
                main_product_id: params.id,
                offer_product_id: offerProductId,
                headline,
                description,
                ordem: count
            }
        })

        return NextResponse.json(bump)

    } catch (error) {
        console.error('[API Bumps POST]', error)
        return NextResponse.json({ error: 'Erro ao criar bump' }, { status: 500 })
    }
}
