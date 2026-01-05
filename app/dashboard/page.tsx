import { prisma } from '@/lib/db'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { DollarSign, CreditCard, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1. Total Receita
    const totalRevenueAgg = await prisma.vendas.aggregate({
        _sum: { valor: true },
        where: {
            status_pagamento: 'approved',
            produtos: { usuario_id: userId }
        }
    })
    const totalRevenue = Number(totalRevenueAgg._sum.valor) || 0

    // 2. Vendas Hoje
    const todayRevenueAgg = await prisma.vendas.aggregate({
        _sum: { valor: true },
        _count: { id: true },
        where: {
            status_pagamento: 'approved',
            data_venda: { gte: startOfDay },
            produtos: { usuario_id: userId }
        }
    })
    const todayRevenue = Number(todayRevenueAgg._sum.valor) || 0
    const todayCount = todayRevenueAgg._count.id

    // 3. Vendas Mês
    const monthRevenueAgg = await prisma.vendas.aggregate({
        _sum: { valor: true },
        _count: { id: true },
        where: {
            status_pagamento: 'approved',
            data_venda: { gte: startOfMonth },
            produtos: { usuario_id: userId }
        }
    })
    const monthRevenue = Number(monthRevenueAgg._sum.valor) || 0
    const monthCount = monthRevenueAgg._count.id

    // 4. Ativos (Alunos)
    const activeStudents = await prisma.alunos_acessos.count({
        where: {
            produtos: { usuario_id: userId }
        }
    })

    // 5. Gráfico (Últimos 7 dias)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const chartDataRaw: any[] = await prisma.$queryRaw`
        SELECT DATE(v.data_venda) as date, SUM(v.valor) as amount, COUNT(v.id) as count
        FROM vendas v
        JOIN produtos p ON v.produto_id = p.id
        WHERE v.status_pagamento = 'approved' 
        AND v.data_venda >= ${last7Days}
        AND p.usuario_id = ${userId}
        GROUP BY DATE(v.data_venda)
        ORDER BY date ASC
    `

    const chartData = chartDataRaw.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        amount: Number(d.amount),
        vendas: Number(d.count)
    }))

    // 6. Últimas Vendas
    const recentSalesRaw = await prisma.vendas.findMany({
        take: 5,
        orderBy: { data_venda: 'desc' },
        where: { produtos: { usuario_id: userId } },
        include: { produtos: true }
    })

    const recentSales = recentSalesRaw.map((v: any) => ({
        id: v.id,
        customerName: v.comprador_nome || 'Cliente',
        customerEmail: v.comprador_email,
        amount: Number(v.valor),
        status: v.status_pagamento,
        date: v.data_venda.toISOString()
    }))

    // 7. SaaS Info (Assinatura e Limites)
    const subscription = await prisma.saas_assinaturas.findFirst({
        where: { usuario_id: userId, status: 'ativo' },
        include: { saas_planos: true },
        orderBy: { data_inicio: 'desc' }
    })

    const totalProducts = await prisma.produtos.count({
        where: { usuario_id: userId }
    })

    // 8. PWA Config (VAPID Key)
    const pwaConfig = await prisma.pwa_config.findFirst({
        select: { vapid_public_key: true }
    })

    return {
        totalRevenue,
        todayRevenue,
        todayCount,
        monthRevenue,
        monthCount,
        activeStudents,
        chartData,
        recentSales,
        subscription,
        totalProducts,
        vapidPublicKey: pwaConfig?.vapid_public_key
    }
}

import { PushManager } from '@/components/pwa/push-manager'

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect('/login')
    }

    const data = await getDashboardData(session.user.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2">
                    <PushManager vapidPublicKey={data.vapidPublicKey || undefined} />
                    <Button asChild>
                        <Link href="/dashboard/products/new">
                            + Novo Produto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* SaaS Plan Status */}
            {data.subscription && (
                <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-[#D4AF37]">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-white text-lg">Meu Plano: {data.subscription.saas_planos.nome}</CardTitle>
                            <Link href="/pricing" className="text-xs text-[#D4AF37] hover:underline uppercase font-bold">
                                Fazer Upgrade
                            </Link>
                        </div>
                        <CardDescription>
                            Acompanhe o consumo dos seus limites.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Produtos</span>
                                <span>{data.totalProducts} / {data.subscription.saas_planos.max_produtos || '∞'}</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#D4AF37]"
                                    style={{
                                        width: `${data.subscription.saas_planos.max_produtos ? Math.min((data.totalProducts / data.subscription.saas_planos.max_produtos) * 100, 100) : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Vendas (Mês)</span>
                                <span>{data.monthCount} / {data.subscription.saas_planos.max_pedidos_mes || '∞'}</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500"
                                    style={{
                                        width: `${data.subscription.saas_planos.max_pedidos_mes ? Math.min((data.monthCount / data.subscription.saas_planos.max_pedidos_mes) * 100, 100) : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Receita Total"
                    value={`R$ ${data.totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    description="Total acumulado"
                    trend={0}
                />
                <KpiCard
                    title="Vendas Hoje"
                    value={`R$ ${data.todayRevenue.toFixed(2)}`}
                    icon={Activity}
                    description={`${data.todayCount} vendas hoje`}
                    trend={0}
                />
                <KpiCard
                    title="Vendas Mês"
                    value={`R$ ${data.monthRevenue.toFixed(2)}`}
                    icon={CreditCard}
                    description={`${data.monthCount} vendas este mês`}
                    trend={0}
                />
                <KpiCard
                    title="Alunos Ativos"
                    value={data.activeStudents.toString()}
                    icon={Users}
                    description="Total de acessos liberados"
                    trend={0}
                />
            </div>

            {/* Gráficos e Tabelas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <SalesChart data={data.chartData} />
                <RecentSales sales={data.recentSales} />
            </div>
        </div>
    )
}
