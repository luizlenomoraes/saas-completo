import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, DollarSign, ShoppingCart, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Verificar se é admin
    if (session.user.type !== 'admin') {
        redirect('/dashboard')
    }

    // Estatísticas gerais do sistema
    const [totalUsers, totalProducts, totalSales, totalRevenue] = await Promise.all([
        prisma.usuarios.count(),
        prisma.produtos.count(),
        prisma.vendas.count({ where: { status_pagamento: 'approved' } }),
        prisma.vendas.aggregate({
            where: { status_pagamento: 'approved' },
            _sum: { valor: true }
        })
    ])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    // Últimos usuários cadastrados
    const recentUsers = await prisma.usuarios.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, usuario: true, nome: true, tipo: true, createdAt: true }
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
                <p className="text-muted-foreground">
                    Gerencie todos os usuários e configurações do sistema
                </p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Infoprodutores cadastrados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">
                            Produtos na plataforma
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSales}</div>
                        <p className="text-xs text-muted-foreground">
                            Vendas aprovadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(Number(totalRevenue._sum.valor || 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Faturamento da plataforma
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/admin/users">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Gerenciar Usuários
                            </CardTitle>
                            <CardDescription>
                                Ver e gerenciar todos os infoprodutores
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/admin/products">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Todos os Produtos
                            </CardTitle>
                            <CardDescription>
                                Ver todos os produtos da plataforma
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/admin/settings">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Configurações
                            </CardTitle>
                            <CardDescription>
                                Configurações globais do sistema
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>

            {/* Recent Users */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuários Recentes</CardTitle>
                    <CardDescription>
                        Últimos usuários cadastrados na plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-primary">
                                            {user.nome?.charAt(0).toUpperCase() || user.usuario.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{user.nome || user.usuario}</p>
                                        <p className="text-sm text-muted-foreground">{user.usuario}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {user.tipo}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
