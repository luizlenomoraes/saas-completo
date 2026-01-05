import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Buscar produto específico
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const produto = await prisma.produtos.findFirst({
            where: {
                id: params.id,
                usuario_id: session.user.id
            },
            include: {
                cursos: {
                    include: {
                        modulos: {
                            orderBy: { ordem: 'asc' },
                            include: {
                                aulas: { orderBy: { ordem: 'asc' } }
                            }
                        }
                    }
                }
            }
        })

        if (!produto) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        return NextResponse.json({ produto })
    } catch (error: any) {
        console.error('[API Product GET Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar produto
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar se o produto pertence ao usuário
        const existingProduct = await prisma.produtos.findFirst({
            where: { id: params.id, usuario_id: session.user.id }
        })

        if (!existingProduct) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const { nome, descricao, preco, preco_anterior, tipo_entrega, gateway, foto, conteudo_entrega, checkout_config } = body

        await prisma.produtos.update({
            where: { id: params.id },
            data: {
                nome: nome || existingProduct.nome,
                descricao: descricao !== undefined ? descricao : existingProduct.descricao,
                preco: preco ? parseFloat(preco) : existingProduct.preco,
                preco_anterior: preco_anterior !== undefined ? (preco_anterior ? parseFloat(preco_anterior) : null) : existingProduct.preco_anterior,
                // Cast to enum; Prisma accepts string matching enum values
                tipo_entrega: (tipo_entrega ?? existingProduct.tipo_entrega) as any,
                gateway: gateway || existingProduct.gateway,
                foto: foto !== undefined ? foto : existingProduct.foto,
                conteudo_entrega: conteudo_entrega !== undefined ? conteudo_entrega : existingProduct.conteudo_entrega,
                checkout_config: checkout_config || existingProduct.checkout_config,
            },
        })

        // Sync course based on delivery type
        const newTipoEntrega = tipo_entrega ?? existingProduct.tipo_entrega;
        const cursoExiste = await prisma.cursos.findFirst({
            where: { produto_id: params.id },
        });
        if (newTipoEntrega === 'area_membros') {
            // Ensure a course exists
            if (!cursoExiste) {
                await prisma.cursos.create({
                    data: {
                        id: crypto.randomUUID(),
                        produto_id: params.id,
                        titulo: nome || existingProduct.nome,
                        descricao: descricao || existingProduct.descricao,
                    },
                });
            }
        } else {
            // If delivery type changed away from area_membros, delete existing course
            if (cursoExiste) {
                await prisma.cursos.delete({ where: { id: cursoExiste.id } });
            }
        }

        return NextResponse.json({ success: true, message: 'Produto atualizado' })
    } catch (error: any) {
        console.error('[API Product PUT Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Excluir produto
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar se o produto pertence ao usuário
        const existingProduct = await prisma.produtos.findFirst({
            where: { id: params.id, usuario_id: session.user.id }
        })

        if (!existingProduct) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }

        // O cascade delete vai remover cursos, módulos, aulas, vendas, etc
        await prisma.produtos.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true, message: 'Produto excluído' })
    } catch (error: any) {
        console.error('[API Product DELETE Error]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
