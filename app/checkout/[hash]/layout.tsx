import { prisma } from '@/lib/db'
import { TrackingScripts } from '@/components/analytics/tracking-scripts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Checkout Seguro',
    description: 'Finalize sua compra com segurança.',
    robots: 'noindex, nofollow', // Checkout não deve ser indexado
}

export default async function CheckoutLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: { hash: string }
}) {
    // Busca o produto pelo hash para saber quem é o dono e injetar os pixels corretos
    const product = await prisma.produtos.findUnique({
        where: { checkout_hash: params.hash },
        select: { usuario_id: true }
    })

    return (
        <>
            {product && <TrackingScripts userId={product.usuario_id} />}
            {children}
        </>
    )
}
