import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Calendar, Package, ShoppingCart, DollarSign, User } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUserDetailPage({
    params
}: {
    params: { id: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.type !== 'admin') {
        redirect('/login')
    }

    const userId = params.id

    // Buscar usuário com dados relacionados
    const user = await prisma.usuarios.findUnique({
        where: { id: userId },
        include: {
            produtos: {
                include: {
                    _count: {
                        select: { vendas: true }
                    }
                }
            }
        }
    })

    if (!user) {
        notFound()
    }

    // Estatísticas do usuário - contar vendas de todos os produtos
    const productIds = user.produtos.map(p => p.id)

    const salesStats = productIds.length > 0 ? await prisma.vendas.aggregate({
        where: {
            produto_id: { in: productIds },
            status_pagamento: 'approved'
        },
        _count: true,
        _sum: { valor: true }
    }) : { _count: 0, _sum: { valor: null } }

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date))
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{user.nome || user.usuario}</h1>
                    <p className="text-muted-foreground">
                        Detalhes do usuário
                    </p>
                </div>
            </div>

            {/* User Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Usuário
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex items-center gap-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${user.tipo === 'admin'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                <span className="text-2xl font-semibold">
                                    {user.nome?.charAt(0).toUpperCase() || user.usuario.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-medium">{user.nome || 'Sem nome'}</p>
                                <Badge variant={user.tipo === 'admin' ? 'destructive' : 'secondary'}>
                                    {user.tipo}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{user.usuario}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Cadastrado em {formatDate(user.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.produtos.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesStats._count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(Number(salesStats._sum?.valor || 0))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Products */}
            <Card>
                <CardHeader>
                    <CardTitle>Produtos do Usuário</CardTitle>
                    <CardDescription>
                        {user.produtos.length} produto(s) cadastrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user.produtos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Este usuário ainda não possui produtos
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {user.produtos.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        {product.foto ? (
                                            <img
                                                src={product.foto}
                                                alt={product.nome}
                                                className="h-12 w-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{product.nome}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(Number(product.preco))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline">
                                            {product._count.vendas} venda(s)
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
