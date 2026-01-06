import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, RefreshCcw, ShieldCheck, CreditCard, User, MapPin, Tag } from 'lucide-react'
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

export default async function SaleDetailsPage({ params }: { params: { id: string } }) {
    const sale = await prisma.vendas.findUnique({
        where: { id: params.id },
        include: { produtos: true }
    })

    if (!sale) {
        return <div className="p-8">Venda não encontrada</div>
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/sales">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Detalhes da Venda</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        #{sale.id} • {format(sale.data_venda, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {getStatusBadge(sale.status_pagamento)}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* Coluna Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Produtos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Itens do Pedido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center py-4 border-b last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-2xl">
                                        📦
                                    </div>
                                    <div>
                                        <p className="font-medium">{sale.produtos.nome}</p>
                                        <p className="text-sm text-muted-foreground">Gateway: {sale.produtos.gateway || 'Padrão'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">R$ {Number(sale.valor).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Pagamento Único</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados do Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Dados do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                                    <p>{sale.comprador_nome}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p>{sale.comprador_email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">CPF</p>
                                    <p>{sale.comprador_cpf || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                                    <p>{sale.comprador_telefone || 'Não informado'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rastreamento & Marketing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Origem (UTMs)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">Source</p>
                                    <p className="font-mono text-sm">{sale.utm_source || '-'}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">Medium</p>
                                    <p className="font-mono text-sm">{sale.utm_medium || '-'}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">Campaign</p>
                                    <p className="font-mono text-sm">{sale.utm_campaign || '-'}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">SRC</p>
                                    <p className="font-mono text-sm">{sale.src || '-'}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">SCK</p>
                                    <p className="font-mono text-sm">{sale.sck || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna Lateral - Ações e Info da Transação */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Transação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ID da Transação</p>
                                <p className="font-mono text-sm break-all">{sale.transacao_id || 'Pendente'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Checkout Session UUID</p>
                                <p className="font-mono text-xs break-all text-muted-foreground">{sale.checkout_session_uuid || 'N/A'}</p>
                                {/* nota: checkout_hash aqui pode estar errado no contexto se não for o id da venda. ajustando */}
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm">Valor Bruto</span>
                                    <span>R$ {Number(sale.valor).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground mb-2">
                                    <span className="text-sm">Taxas (Est.)</span>
                                    <span className="text-red-400">- R$ 0,00</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-lg pt-2 border-t">
                                    <span>Líquido</span>
                                    <span className="text-green-600">R$ {Number(sale.valor).toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                Ações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full" variant="outline">
                                <Mail className="w-4 h-4 mr-2" />
                                Reenviar Email de Acesso
                            </Button>

                            <Button className="w-full" variant="secondary">
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Liberar Acesso Manualmente
                            </Button>

                            <Button className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" variant="ghost">
                                Reembolsar Venda
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
