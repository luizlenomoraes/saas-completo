import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT - Atualizar Bump
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string, bumpId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { headline, description, is_active } = body

        // Verificar propriedade via produto principal
        const bump = await prisma.order_bumps.findUnique({
            where: { id: params.bumpId },
            include: { produtos_order_bumps_main_product_idToprodutos: true }
        })

        if (!bump || bump.produtos_order_bumps_main_product_idToprodutos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Bump não encontrado' }, { status: 404 })
        }

        const updated = await prisma.order_bumps.update({
            where: { id: params.bumpId },
            data: {
                headline: headline !== undefined ? headline : bump.headline,
                description: description !== undefined ? description : bump.description,
                is_active: is_active !== undefined ? is_active : bump.is_active
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('[API Bump PUT]', error)
        return NextResponse.json({ error: 'Erro ao atualizar bump' }, { status: 500 })
    }
}

// DELETE - Remover Bump
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string, bumpId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        // Verificar propriedade
        const bump = await prisma.order_bumps.findUnique({
            where: { id: params.bumpId },
            include: { produtos_order_bumps_main_product_idToprodutos: true }
        })

        if (!bump || bump.produtos_order_bumps_main_product_idToprodutos.usuario_id !== session.user.id) {
            return NextResponse.json({ error: 'Bump não encontrado' }, { status: 404 })
        }

        await prisma.order_bumps.delete({
            where: { id: params.bumpId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Bump DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir bump' }, { status: 500 })
    }
}
