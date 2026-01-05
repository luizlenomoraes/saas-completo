import { getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth'
import { redirect } from "next/navigation"
import { prisma } from '@/lib/db'
import { SaasDashboard } from "@/components/admin/saas/saas-dashboard"

export default async function SaasAdminPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.type !== 'admin') {
        redirect('/login')
    }

    // Buscar Configuração Global
    const config = await prisma.saas_config.findUnique({
        where: { id: 'saas-main-config' }
    })

    // Buscar Planos
    const planos = await prisma.saas_planos.findMany({
        orderBy: { ordem: 'asc' }
    })

    // Serializar dados (Decimal -> Number)
    const serializedPlans = planos.map(p => ({
        ...p,
        preco: Number(p.preco),
        descricao: p.descricao || '',
        criado_em: p.criado_em.toISOString(),
        atualizado_em: p.atualizado_em.toISOString()
    }))

    // Buscar Gateway Admin (MP)
    const mpGateway = await prisma.saas_admin_gateways.findUnique({
        where: { gateway: 'mercadopago' },
        select: { mp_access_token: true }
    })

    return (
        <div className="p-6">
            <SaasDashboard
                initialConfig={{ enabled: config?.enabled || false }}
                initialPlans={serializedPlans}
                initialMpGateway={mpGateway ? { mp_access_token: mpGateway.mp_access_token } : undefined}
            />
        </div>
    )
}
