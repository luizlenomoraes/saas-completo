import { prisma } from '@/lib/db'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Planos e Preços',
    description: 'Escolha o plano ideal para escalar seu negócio de infoprodutos.'
}

export default async function PricingPage() {
    // Buscar planos ativos
    const planos = await prisma.saas_planos.findMany({
        where: { ativo: true },
        orderBy: [{ preco: 'asc' }, { ordem: 'asc' }]
    })

    const serializedPlans = planos.map(p => ({
        ...p,
        preco: Number(p.preco),
        descricao: p.descricao || '',
        criado_em: p.criado_em.toISOString(),
        atualizado_em: p.atualizado_em.toISOString()
    }))

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F6D764]">
                        Planos Transparentes
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Comece grátis e escale conforme seu negócio cresce. Sem taxas ocultas.
                    </p>
                </div>

                <PricingCards plans={serializedPlans} />
            </div>
        </div>
    )
}
