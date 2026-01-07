import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
        case 'approved':
        case 'paid':
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Aprovado</Badge>
        case 'pending':
        case 'waiting':
            return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">Pendente</Badge>
        case 'rejected':
        case 'refused':
        case 'cancelled':
            return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelado</Badge>
        default:
            return <Badge variant="secondary" className="bg-white/5 text-zinc-400">Outro</Badge>
    }
}

export function RecentSales({ sales }: RecentSalesProps) {
    return (
        <div className="col-span-3 glass-panel rounded-xl p-6 border border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-medium text-white mb-6">Últimas Transações</h3>

            <div className="space-y-6 flex-1 overflow-auto pr-2 custom-scrollbar">
                {sales.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-8">
                        <p>Nenhuma venda recente.</p>
                    </div>
                )}

                {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center group">
                        <Avatar className="h-10 w-10 border border-white/10 group-hover:border-[#D4AF37]/50 transition-colors">
                            <AvatarFallback className="bg-white/5 text-[#D4AF37] font-medium">
                                {getInitials(sale.customerName || 'Cliente')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1 flex-1">
                            <p className="text-sm font-medium text-white leading-none group-hover:text-[#D4AF37] transition-colors">
                                {sale.customerName}
                            </p>
                            <p className="text-xs text-zinc-500 truncate max-w-[150px]">
                                {sale.customerEmail}
                            </p>
                        </div>
                        <div className="ml-auto font-medium flex flex-col items-end gap-1">
                            <span className="text-white">+ R$ {sale.amount.toFixed(2)}</span>
                            {getStatusBadge(sale.status)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
