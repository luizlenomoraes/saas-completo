'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash, CreditCard, List, Check } from 'lucide-react'
import { PlanForm } from './plan-form'
import { GatewaysForm } from './gateways-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SaasConfig {
    enabled: boolean
}

interface SaasPlan {
    id: string
    nome: string
    descricao: string
    preco: number
    periodo: 'mensal' | 'anual'
    max_produtos: number | null
    max_pedidos_mes: number | null
    is_free: boolean
    ativo: boolean
}

interface SaasDashboardProps {
    initialConfig: SaasConfig
    initialPlans: SaasPlan[]
    initialMpGateway?: { mp_access_token: string | null }
}

export function SaasDashboard({ initialConfig, initialPlans, initialMpGateway }: SaasDashboardProps) {
    const router = useRouter()
    const [config, setConfig] = useState(initialConfig)
    const [plans, setPlans] = useState(initialPlans)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<SaasPlan | undefined>(undefined)

    const toggleSaas = async (checked: boolean) => {
        try {
            const res = await fetch('/api/admin/saas/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: checked })
            })
            if (!res.ok) throw new Error('Falha')

            setConfig({ ...config, enabled: checked })
            toast.success(checked ? 'Modo SaaS Ativado' : 'Modo SaaS Desativado')
            router.refresh()
        } catch (e) {
            toast.error('Erro ao atualizar configuração')
        }
    }

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return

        try {
            const res = await fetch(`/api/admin/saas/plans/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Falha')

            toast.success('Plano removido')
            setPlans(plans.filter(p => p.id !== id))
            router.refresh()
        } catch (e) {
            toast.error('Erro ao remover plano')
        }
    }

    const handleEditPlan = (plan: any) => {
        const formattedPlan = {
            ...plan,
            periodo: plan.periodo as 'mensal' | 'anual',
            max_produtos: plan.max_produtos,
            max_pedidos_mes: plan.max_pedidos_mes
        }
        setEditingPlan(formattedPlan)
        setIsDialogOpen(true)
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        setEditingPlan(undefined)
        router.refresh()
    }

    useEffect(() => {
        setPlans(initialPlans)
    }, [initialPlans])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Gestão de Assinaturas (SaaS)</h2>
                    <p className="text-muted-foreground">Configure planos, preços e limites da plataforma.</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                    <Label className="text-sm font-medium">Modo SaaS:</Label>
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={toggleSaas}
                        className="data-[state=checked]:bg-[#D4AF37]"
                    />
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded", config.enabled ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-500")}>
                        {config.enabled ? 'ATIVO' : 'INATIVO'}
                    </span>
                </div>
            </div>

            <Tabs defaultValue="plans" className="w-full">
                <TabsList className="bg-black/20 border border-white/10 p-1">
                    <TabsTrigger value="plans" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <List className="w-4 h-4 mr-2" /> Planos
                    </TabsTrigger>
                    <TabsTrigger value="gateways" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <CreditCard className="w-4 h-4 mr-2" /> Gateways
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="mt-6">
                    <div className="flex justify-end mb-4">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#D4AF37] hover:bg-[#B5952F] text-black" onClick={() => setEditingPlan(undefined)}>
                                    <Plus className="w-4 h-4 mr-2" /> Novo Plano
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] border-zinc-800 bg-zinc-950 text-white">
                                <DialogHeader>
                                    <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                                </DialogHeader>
                                <PlanForm
                                    initialData={editingPlan}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setIsDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plano) => (
                            <Card key={plano.id} className={cn("bg-black/40 border-white/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-[#D4AF37]/50", !plano.ativo && "opacity-60")}>
                                {plano.is_free && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                        GRÁTIS
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl flex justify-between items-center text-gradient-gold">
                                        {plano.nome}
                                        <span className="text-sm font-normal text-muted-foreground">R$ {Number(plano.preco).toFixed(2)}/{plano.periodo === 'mensal' ? 'mês' : 'ano'}</span>
                                    </CardTitle>
                                    <CardDescription>{plano.descricao || 'Sem descrição'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-[#D4AF37]" />
                                            {plano.max_produtos === 0 || !plano.max_produtos ? 'Produtos Ilimitados' : `${plano.max_produtos} Produtos`}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-[#D4AF37]" />
                                            {plano.max_pedidos_mes === 0 || !plano.max_pedidos_mes ? 'Vendas Ilimitadas' : `${plano.max_pedidos_mes} Vendas/mês`}
                                        </li>
                                    </ul>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 hover:bg-zinc-800" onClick={() => handleEditPlan(plano)}>
                                            <Edit className="w-4 h-4 mr-2" /> Editar
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-900/20" onClick={() => handleDeletePlan(plano.id)}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {plans.length === 0 && (
                            <div className="col-span-full py-10 text-center text-muted-foreground border border-dashed border-zinc-800 rounded-lg">
                                Nenhum plano cadastrado.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="gateways" className="mt-6">
                    <GatewaysForm initialData={initialMpGateway} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
