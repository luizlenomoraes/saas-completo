import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { SubscribeForm } from "@/components/saas/subscribe-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default async function SubscribePage({ params }: { params: { planId: string } }) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect(`/login?callbackUrl=/dashboard/subscribe/${params.planId}`)
    }

    const plano = await prisma.saas_planos.findUnique({
        where: { id: params.planId }
    })

    if (!plano || !plano.ativo) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Plano não encontrado ou inativo.</h1>
                <a href="/pricing" className="text-[#D4AF37] hover:underline mt-4 block">Voltar para Planos</a>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <h1 className="text-3xl font-bold mb-8 text-gradient-gold">Finalizar Assinatura</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Resumo do Plano */}
                <Card className="bg-zinc-900 border-zinc-800 h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">{plano.nome}</CardTitle>
                        <CardDescription>{plano.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-[#D4AF37]">
                            {plano.is_free ? 'Grátis' : `R$ ${Number(plano.preco).toFixed(2)}`}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                                /{plano.periodo === 'mensal' ? 'mês' : 'ano'}
                            </span>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <Check className="w-4 h-4 text-green-500" />
                                {plano.max_produtos ? `${plano.max_produtos} produtos` : 'Produtos Ilimitados'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <Check className="w-4 h-4 text-green-500" />
                                {plano.max_pedidos_mes ? `${plano.max_pedidos_mes} vendas/mês` : 'Vendas Ilimitadas'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulário de Pagamento */}
                <div>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-xl text-white">Pagamento</CardTitle>
                            <CardDescription>Escolha como deseja pagar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SubscribeForm
                                planId={plano.id}
                                planName={plano.nome}
                                price={Number(plano.preco)}
                                isFree={plano.is_free}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
