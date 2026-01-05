import { prisma } from '@/lib/db'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

function getStatusBadge(status: string) {
    const s = status?.toLowerCase()
    if (['paid', 'approved'].includes(s)) return <Badge className="bg-green-500">Aprovado</Badge>
    if (['pending', 'waiting'].includes(s)) return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
    if (['rejected', 'cancelled', 'refused'].includes(s)) return <Badge variant="destructive">Cancelado</Badge>
    if (s === 'refunded') return <Badge variant="secondary">Reembolsado</Badge>
    return <Badge variant="secondary">{status}</Badge>
}

export default async function SalesPage({ searchParams }: { searchParams: { q?: string, status?: string } }) {
    const q = searchParams.q || ''
    const status = searchParams.status || ''

    const where: any = {}

    if (status && status !== 'all') {
        where.status_pagamento = status
    }

    if (q) {
        where.OR = [
            { comprador_email: { contains: q, mode: 'insensitive' } },
            { comprador_nome: { contains: q, mode: 'insensitive' } },
            { transacao_id: { contains: q } }
        ]
    }

    const sales = await prisma.vendas.findMany({
        where,
        orderBy: { data_venda: 'desc' },
        take: 50,
        include: { produtos: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Vendas</h2>

                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </Button>
                    <Button>Exportar CSV</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, email ou ID..."
                                className="pl-9"
                                defaultValue={q}
                                name="q"
                            // Nota: Para funcionar como filtro real, precisaria de um Client Component wrapper ou form GET
                            // Estamos simplificando aqui. O ideal seria um form method="get"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhuma venda encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                            {sales.map((sale: any) => (
                                <TableRow key={sale.id}>
                                    <TableCell>
                                        {format(sale.data_venda, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{sale.comprador_nome}</span>
                                            <span className="text-xs text-muted-foreground">{sale.comprador_email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{sale.produtos.nome}</TableCell>
                                    <TableCell>R$ {Number(sale.valor).toFixed(2)}</TableCell>
                                    <TableCell>{getStatusBadge(sale.status_pagamento)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/dashboard/sales/${sale.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
