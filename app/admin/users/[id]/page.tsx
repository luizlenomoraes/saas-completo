import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Calendar, Package, ShoppingCart, DollarSign, User, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'

export default async function AdminUserDetailPage({
    params
}: {
    params: { id: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.type !== 'admin') redirect('/login')

    const userId = params.id

    const user = await prisma.usuarios.findUnique({
        where: { id: userId },
        include: {
            produtos: {
                include: {
                    _count: { select: { vendas: true } }
                }
            }
        }
    })

    if (!user) notFound()

    // Estatísticas
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
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(date))
    }

    return (
        <PageTransition className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-serif text-white">Detalhes do Usuário</h1>
                    <p className="text-zinc-500 text-sm">Visualizando perfil de {user.nome}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="glass-panel p-8 rounded-xl border border-white/5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 ${user.tipo === 'admin'
                            ? 'bg-red-500/10 text-red-500 border-red-500/30'
                            : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]'
                        }`}>
                        {user.nome?.charAt(0).toUpperCase() || user.usuario.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-white tracking-tight">{user.nome || 'Sem nome'}</h2>
                                <Badge className={
                                    user.tipo === 'admin'
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                                }>
                                    {user.tipo === 'infoprodutor' ? 'Produtor' : 'Administrador'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 mt-1">
                                <Mail className="h-4 w-4" />
                                <span>{user.usuario}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-zinc-500" />
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Data de Cadastro</p>
                                    <p className="text-sm text-zinc-200">{formatDate(user.createdAt)}</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                <User className="h-4 w-4 text-zinc-500" />
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">ID do Usuário</p>
                                    <p className="text-sm text-zinc-200 font-mono">{user.id.substring(0, 8)}...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {user.tipo === 'admin' && (
                        <div className="px-6 py-4 rounded-xl bg-red-900/10 border border-red-900/30 flex items-center gap-3 text-red-400 max-w-xs">
                            <ShieldAlert className="h-8 w-8 flex-shrink-0" />
                            <p className="text-xs leading-relaxed">Este usuário possui acesso total ao sistema administrativo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Produtos Criados</p>
                        <p className="text-2xl font-bold text-white">{user.produtos.length}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Vendas Totais</p>
                        <p className="text-2xl font-bold text-white">{salesStats._count}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Faturamento Total</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(Number(salesStats._sum?.valor || 0))}</p>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Catálogo de Produtos</h3>
                    <Badge variant="outline" className="border-white/10 text-zinc-400 bg-transparent">
                        {user.produtos.length} Ativos
                    </Badge>
                </div>

                <div className="divide-y divide-white/5">
                    {user.produtos.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            Este usuário ainda não criou nenhum produto.
                        </div>
                    ) : (
                        user.produtos.map((product) => (
                            <div key={product.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0">
                                        {product.foto ? (
                                            <img
                                                src={product.foto}
                                                alt={product.nome}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-700">
                                                <Package className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-[#D4AF37] transition-colors">{product.nome}</p>
                                        <p className="text-sm text-[#D4AF37] font-medium">
                                            {formatCurrency(Number(product.preco))}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Vendas</p>
                                        <p className="text-sm text-white font-mono">{product._count.vendas}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-white" asChild>
                                        <Link href={`/dashboard/products/${product.id}`}>
                                            Ver Produto
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
