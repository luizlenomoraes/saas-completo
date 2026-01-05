import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Sale {
    id: string
    customerName: string
    customerEmail: string
    amount: number
    status: string
    date: string
}

interface RecentSalesProps {
    sales: Sale[]
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
        case 'approved':
        case 'paid':
            return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>
        case 'pending':
        case 'waiting':
            return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
        case 'rejected':
        case 'refused':
        case 'cancelled':
            return <Badge variant="destructive">Cancelado</Badge>
        case 'refunded':
            return <Badge variant="secondary">Reembolsado</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

export function RecentSales({ sales }: RecentSalesProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Últimas Vendas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {sales.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            Nenhuma venda recente.
                        </p>
                    )}

                    {sales.map((sale) => (
                        <div key={sale.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(sale.customerName || 'Cliente')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{sale.customerName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {sale.customerEmail}
                                </p>
                            </div>
                            <div className="ml-auto font-medium flex flex-col items-end gap-1">
                                <span>+R$ {sale.amount.toFixed(2)}</span>
                                {getStatusBadge(sale.status)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
