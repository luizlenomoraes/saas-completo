import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Search, DollarSign, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

export default async function AdminProductsPage({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.type !== 'admin') {
        redirect('/login')
    }

    const search = searchParams.q || ''

    // Buscar todos os produtos
    const products = await prisma.produtos.findMany({
        where: search ? {
            OR: [
                { nome: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { data_criacao: 'desc' },
        include: {
            usuarios: {
                select: { id: true, nome: true, usuario: true }
            },
            _count: {
                select: { vendas: true }
            }
        }
    })

    // Estatísticas
    const totalProducts = await prisma.produtos.count()

    const salesStats = await prisma.vendas.aggregate({
        where: { status_pagamento: 'approved' },
        _count: true,
        _sum: { valor: true }
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (date: Date | null) => {
        if (!date) return '-'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(date))
    }

    const getDeliveryBadge = (tipo: string | null) => {
        switch (tipo) {
            case 'area_membros':
                return <Badge className="bg-purple-100 text-purple-700">Área de Membros</Badge>
            case 'download':
                return <Badge className="bg-blue-100 text-blue-700">Download</Badge>
            case 'externo':
                return <Badge className="bg-orange-100 text-orange-700">Link Externo</Badge>
            default:
                return <Badge variant="secondary">Sem entrega</Badge>
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Todos os Produtos</h1>
                <p className="text-muted-foreground">
                    Visualize todos os produtos da plataforma
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesStats._count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(Number(salesStats._sum?.valor || 0))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Buscar</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                placeholder="Buscar por nome do produto..."
                                defaultValue={search}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit">Buscar</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Products List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Produtos</CardTitle>
                    <CardDescription>
                        {products.length} produto(s) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum produto encontrado
                            </div>
                        ) : (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {product.foto ? (
                                            <img
                                                src={product.foto}
                                                alt={product.nome}
                                                className="h-16 w-16 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                                                <Package className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{product.nome}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(Number(product.preco))}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Link
                                                    href={`/admin/users/${product.usuario_id}`}
                                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <User className="h-3 w-3" />
                                                    {product.usuarios.nome || product.usuarios.usuario}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(product.data_criacao)}
                                            </div>
                                            <div className="text-sm font-medium">
                                                {product._count.vendas} venda(s)
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 items-end">
                                            {getDeliveryBadge(product.tipo_entrega)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
