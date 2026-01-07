import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, MoreVertical, Mail, Calendar, Package, ShieldAlert, User, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: { q?: string; tipo?: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session) redirect('/login')
    if (session.user.type !== 'admin') redirect('/dashboard')

    const search = searchParams.q || ''
    const tipo = searchParams.tipo || ''

    // Buscar usuários com filtros
    const users = await prisma.usuarios.findMany({
        where: {
            AND: [
                search ? {
                    OR: [
                        { nome: { contains: search, mode: 'insensitive' } },
                        { usuario: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                tipo ? { tipo: tipo as 'admin' | 'infoprodutor' } : {}
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { produtos: true }
            }
        }
    })

    // Estatísticas
    const stats = await prisma.usuarios.groupBy({
        by: ['tipo'],
        _count: true
    })

    const totalUsers = users.length
    const totalInfoprodutores = stats.find(s => s.tipo === 'infoprodutor')?._count || 0
    const totalAdmins = stats.find(s => s.tipo === 'admin')?._count || 0

    const formatDate = (date: Date | null) => {
        if (!date) return '-'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(date))
    }

    return (
        <PageTransition className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-white mb-2">Gestão de Usuários</h1>
                    <p className="text-zinc-400">Administre o acesso e permissões da plataforma.</p>
                </div>
            </div>

            {/* Stats Cards - Luxury Style */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-20 h-20 text-[#D4AF37]" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-zinc-400 font-medium text-sm">Total de Usuários</p>
                        <h3 className="text-4xl font-serif text-white mt-2">{totalUsers}</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" />
                </div>

                <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <User className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-zinc-400 font-medium text-sm">Infoprodutores</p>
                        <h3 className="text-4xl font-serif text-white mt-2">{totalInfoprodutores}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert className="w-20 h-20 text-red-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-zinc-400 font-medium text-sm">Administradores</p>
                        <h3 className="text-4xl font-serif text-white mt-2">{totalAdmins}</h3>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <form className="flex w-full md:w-auto gap-3 flex-1 max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            name="q"
                            placeholder="Buscar por nome ou email..."
                            defaultValue={search}
                            className="pl-10 bg-black/20 border-white/10 text-white focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 transition-all h-10"
                        />
                    </div>
                    <select
                        name="tipo"
                        defaultValue={tipo}
                        className="px-4 py-2 rounded-md text-sm bg-black/20 border border-white/10 text-white focus:border-[#D4AF37] outline-none cursor-pointer"
                    >
                        <option value="" className="bg-zinc-900">Todos os tipos</option>
                        <option value="infoprodutor" className="bg-zinc-900">Infoprodutor</option>
                        <option value="admin" className="bg-zinc-900">Admin</option>
                    </select>
                    <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold shadow-[0_0_10px_-3px_rgba(212,175,55,0.3)]">
                        Filtrar
                    </Button>
                </form>

                <Button variant="outline" className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 w-full md:w-auto">
                    Exportar Lista
                </Button>
            </div>

            {/* Users List */}
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-medium text-white">Lista de Usuários</h3>
                    <p className="text-sm text-zinc-500">{users.length} resultados encontrados</p>
                </div>

                <div className="divide-y divide-white/5">
                    {users.length === 0 ? (
                        <div className="text-center py-16 text-zinc-500">
                            Nenhum usuário encontrado com os filtros atuais.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.02] transition-colors gap-4 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold border ${user.tipo === 'admin'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 group-hover:border-[#D4AF37]/50'
                                        } transition-colors`}>
                                        {user.nome?.charAt(0).toUpperCase() || user.usuario.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <Link href={`/admin/users/${user.id}`} className="font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                                            {user.nome || 'Usuário sem nome'}
                                        </Link>
                                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                                            <Mail className="h-3 w-3" />
                                            {user.usuario}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 md:ml-auto">
                                    <div className="text-right hidden md:block space-y-1">
                                        <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
                                            <Calendar className="h-3 w-3" />
                                            Cadastrado em {formatDate(user.createdAt)}
                                        </div>
                                        <div className="flex items-center justify-end gap-2 text-xs text-zinc-400">
                                            <Package className="h-3 w-3" />
                                            <span className="text-white font-medium">{user._count.produtos}</span> produtos
                                        </div>
                                    </div>

                                    <Badge className={
                                        user.tipo === 'admin'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                                    }>
                                        {user.tipo === 'infoprodutor' ? 'Produtor' : 'Admin'}
                                    </Badge>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/users/${user.id}`} className="cursor-pointer focus:bg-white/5">
                                                    Ver Detalhes
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 cursor-pointer">
                                                Bloquear Acesso
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
