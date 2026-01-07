import { prisma } from '@/lib/db'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { DollarSign, CreditCard, Users, Activity, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PushManager } from '@/components/pwa/push-manager'
import { PageTransition } from '@/components/ui/page-transition'

export const dynamic = 'force-dynamic'

// ... (Mantenha a função getDashboardData EXATAMENTE IGUAL para não quebrar a lógica)
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

    // 7. SaaS Info
    const subscription = await prisma.saas_assinaturas.findFirst({
        where: { usuario_id: userId, status: 'ativo' },
        include: { saas_planos: true },
        orderBy: { data_inicio: 'desc' }
    })

    const totalProducts = await prisma.produtos.count({
        where: { usuario_id: userId }
    })

    // 8. PWA Config
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

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    const data = await getDashboardData(session.user.id)

    return (
        <PageTransition className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-1">Visão Geral</h2>
                    <p className="text-zinc-400">Acompanhe a performance do seu negócio.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PushManager vapidPublicKey={data.vapidPublicKey || undefined} />
                    <Button asChild className="bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)] transition-all hover:scale-105">
                        <Link href="/dashboard/products/new">
                            + Novo Produto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* SaaS Plan Status - Versão Luxo */}
            {data.subscription && (
                <div className="glass-panel rounded-xl p-6 border-l-4 border-l-[#D4AF37] relative overflow-hidden group">
                    {/* Brilho de fundo animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#D4AF37]/20 rounded-full text-[#D4AF37]">
                                <Crown className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                    Plano {data.subscription.saas_planos.nome}
                                    <span className="text-xs bg-[#D4AF37] text-black px-2 py-0.5 rounded-full font-bold">ATIVO</span>
                                </h3>
                                <p className="text-sm text-zinc-400">Sua assinatura renova em {new Date(data.subscription.data_vencimento).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full md:max-w-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-zinc-300 uppercase tracking-wider">
                                    <span>Produtos</span>
                                    <span>{data.totalProducts} / {data.subscription.saas_planos.max_produtos || '∞'}</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
                                        style={{ width: `${data.subscription.saas_planos.max_produtos ? Math.min((data.totalProducts / data.subscription.saas_planos.max_produtos) * 100, 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-zinc-300 uppercase tracking-wider">
                                    <span>Vendas (Mês)</span>
                                    <span>{data.monthCount} / {data.subscription.saas_planos.max_pedidos_mes || '∞'}</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                                        style={{ width: `${data.subscription.saas_planos.max_pedidos_mes ? Math.min((data.monthCount / data.subscription.saas_planos.max_pedidos_mes) * 100, 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <Link href="/pricing" className="text-sm font-bold text-[#D4AF37] hover:text-white transition-colors border-b border-[#D4AF37] hover:border-white pb-0.5">
                            FAZER UPGRADE
                        </Link>
                    </div>
                </div>
            )}

            {/* KPIs - Já usam o componente refatorado kpi-card */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Receita Total"
                    value={`R$ ${data.totalRevenue.toFixed(2)}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    description="Total acumulado"
                    delay={100}
                />
                <KpiCard
                    title="Vendas Hoje"
                    value={`R$ ${data.todayRevenue.toFixed(2)}`}
                    icon={<Activity className="w-5 h-5" />}
                    description={`${data.todayCount} vendas hoje`}
                    delay={200}
                />
                <KpiCard
                    title="Vendas Mês"
                    value={`R$ ${data.monthRevenue.toFixed(2)}`}
                    icon={<CreditCard className="w-5 h-5" />}
                    description={`${data.monthCount} vendas este mês`}
                    delay={300}
                />
                <KpiCard
                    title="Alunos Ativos"
                    value={data.activeStudents.toString()}
                    icon={<Users className="w-5 h-5" />}
                    description="Acessos liberados"
                    delay={400}
                />
            </div>

            {/* Gráficos e Tabelas */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-fade-up" style={{ animationDelay: '500ms' }}>
                <SalesChart data={data.chartData} />
                <RecentSales sales={data.recentSales} />
            </div>
        </PageTransition>
    )
}
