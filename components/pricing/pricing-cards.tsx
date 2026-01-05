'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SaasPlan {
    id: string
    nome: string
    descricao: string
    preco: number
    periodo: string
    max_produtos: number | null
    max_pedidos_mes: number | null
    is_free: boolean
}

interface PricingCardsProps {
    plans: SaasPlan[]
}

export function PricingCards({ plans }: PricingCardsProps) {
    const router = useRouter()
    const [period, setPeriod] = useState<'mensal' | 'anual'>('mensal')
    const [isLoading, setIsLoading] = useState<string | null>(null)

    // Filtrar planos pelo período selecionado (ou mostrar todos se não tiver flag de periodo no banco para diferenciar - na verdade o banco tem campo 'periodo')
    // Se tivermos planos de mesmo nome com periodos diferentes, agrupamos.
    // Mas aqui vou assumir que cada plano tem um periodo fixo no banco. 
    // Se o usuário quiser mensal e anual, ele cria 2 planos "Pro Mensal" e "Pro Anual".

    // Para simplificar a UI, vamos mostrar abas se houver planos mensais e anuais.
    const monthlyPlans = plans.filter(p => p.periodo === 'mensal' || p.is_free)
    const annualPlans = plans.filter(p => p.periodo === 'anual')

    const displayedPlans = period === 'mensal' ? monthlyPlans : annualPlans

    const handleSubscribe = async (planId: string) => {
        setIsLoading(planId)
        // Redireciona para checkout do plano
        // Se for free, processa direto (futuro)
        router.push(`/dashboard/subscribe/${planId}`)
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-center">
                <Tabs value={period} onValueChange={(v: any) => setPeriod(v)} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mensal">Mensal</TabsTrigger>
                        <TabsTrigger value="anual">Anual (Desconto)</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedPlans.map((plan) => (
                    <Card key={plan.id} className={cn(
                        "flex flex-col relative overflow-hidden transition-all hover:scale-105",
                        plan.is_free ? "border-zinc-800" : "border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                    )}>
                        {plan.nome.toLowerCase().includes('pro') && (
                            <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                                POPULAR
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.nome}</CardTitle>
                            <CardDescription>{plan.descricao}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">
                                    {plan.is_free ? 'Grátis' : `R$ ${plan.preco.toFixed(2)}`}
                                </span>
                                {!plan.is_free && <span className="text-muted-foreground ml-2">/{plan.periodo === 'mensal' ? 'mês' : 'ano'}</span>}
                            </div>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-sm">
                                        {plan.max_produtos === 0 || !plan.max_produtos
                                            ? 'Infoprodutos Ilimitados'
                                            : `Até ${plan.max_produtos} Infoprodutos`}
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-sm">
                                        {plan.max_pedidos_mes === 0 || !plan.max_pedidos_mes
                                            ? 'Vendas Ilimitadas'
                                            : `Até ${plan.max_pedidos_mes} vendas/mês`}
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-sm">Dashboard Completo</span>
                                </li>
                                {plan.nome.toLowerCase().includes('pro') && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span className="text-sm">Suporte Prioritário</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span className="text-sm">Checkout Personalizado</span>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold"
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={!!isLoading}
                            >
                                {isLoading === plan.id ? <Loader2 className="animate-spin" /> : (plan.is_free ? 'Começar Grátis' : 'Assinar Agora')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
