import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, MoreVertical, Mail, Calendar, Package } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUsersPage({
    searchParams
}: {
    searchParams: { q?: string; tipo?: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    if (session.user.type !== 'admin') {
        redirect('/dashboard')
    }

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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os usuários da plataforma
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Infoprodutores</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInfoprodutores}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                        <Users className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAdmins}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                placeholder="Buscar por nome ou email..."
                                defaultValue={search}
                                className="pl-9"
                            />
                        </div>
                        <select
                            name="tipo"
                            defaultValue={tipo}
                            className="px-4 py-2 border rounded-md text-sm bg-background"
                        >
                            <option value="">Todos os tipos</option>
                            <option value="infoprodutor">Infoprodutor</option>
                            <option value="admin">Admin</option>
                        </select>
                        <Button type="submit">Filtrar</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuários</CardTitle>
                    <CardDescription>
                        {users.length} usuário(s) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhum usuário encontrado
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${user.tipo === 'admin'
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-primary/10 text-primary'
                                            }`}>
                                            <span className="text-lg font-semibold">
                                                {user.nome?.charAt(0).toUpperCase() || user.usuario.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.nome || 'Sem nome'}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {user.usuario}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden md:block">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Package className="h-3 w-3" />
                                                {user._count.produtos} produto(s)
                                            </div>
                                        </div>

                                        <Badge variant={user.tipo === 'admin' ? 'destructive' : 'secondary'}>
                                            {user.tipo}
                                        </Badge>

                                        <Link href={`/admin/users/${user.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </Link>
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
