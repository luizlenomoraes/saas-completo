import { prisma } from '@/lib/db'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Users, DollarSign, ShoppingCart, Activity } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { RecentSales } from '@/components/dashboard/recent-sales' // Reutilizando componente
import { SalesChart } from '@/components/dashboard/sales-chart' // Reutilizando componente

export const dynamic = 'force-dynamic'

async function getAdminMetrics() {
    const totalUsers = await prisma.usuarios.count()

    const totalRevenueAgg = await prisma.vendas.aggregate({
        _sum: { valor: true },
        where: { status_pagamento: 'approved' }
    })
    const totalRevenue = Number(totalRevenueAgg._sum.valor) || 0

    const totalSales = await prisma.vendas.count({
        where: { status_pagamento: 'approved' }
    })

    const activeSubscriptions = await prisma.saas_assinaturas.count({
        where: { status: 'ativo' }
    })

    // Gráfico de Receita Global (Últimos 7 dias)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const chartDataRaw: any[] = await prisma.$queryRaw`
        SELECT DATE(data_venda) as date, SUM(valor) as amount, COUNT(id) as count
        FROM vendas
        WHERE status_pagamento = 'approved' AND data_venda >= ${last7Days}
        GROUP BY DATE(data_venda)
        ORDER BY date ASC
    `
    const chartData = chartDataRaw.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        amount: Number(d.amount),
        vendas: Number(d.count)
    }))

    // Últimas vendas do sistema
    const recentSalesRaw = await prisma.vendas.findMany({
        take: 5,
        orderBy: { data_venda: 'desc' },
        include: { produtos: { select: { nome: true } } }
    })

    const recentSales = recentSalesRaw.map((v: any) => ({
        id: v.id,
        customerName: v.comprador_nome || 'Cliente',
        customerEmail: v.produtos.nome, // Mostrando o produto no lugar do email para variar no admin
        amount: Number(v.valor),
        status: v.status_pagamento,
        date: v.data_venda.toISOString()
    }))

    return { totalUsers, totalRevenue, totalSales, activeSubscriptions, chartData, recentSales }
}

export default async function AdminDashboardPage() {
    const data = await getAdminMetrics()

    return (
        <PageTransition className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-white mb-2">Visão Geral do Sistema</h1>
                <p className="text-zinc-400">Monitoramento global da plataforma.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Receita Global"
                    value={`R$ ${data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    description="Faturamento total"
                    delay={100}
                />
                <KpiCard
                    title="Usuários Totais"
                    value={data.totalUsers.toString()}
                    icon={<Users className="w-5 h-5" />}
                    description="Produtores e Alunos"
                    delay={200}
                />
                <KpiCard
                    title="Vendas Totais"
                    value={data.totalSales.toString()}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    description="Transações aprovadas"
                    delay={300}
                />
                <KpiCard
                    title="Assinaturas SaaS"
                    value={data.activeSubscriptions.toString()}
                    icon={<Activity className="w-5 h-5" />}
                    description="Planos ativos"
                    delay={400}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-fade-up" style={{ animationDelay: '500ms' }}>
                <div className="col-span-4">
                    <SalesChart data={data.chartData} />
                </div>
                <div className="col-span-3">
                    <RecentSales sales={data.recentSales} />
                </div>
            </div>
        </PageTransition>
    )
}
