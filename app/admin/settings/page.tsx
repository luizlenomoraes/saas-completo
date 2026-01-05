import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { SettingsForm } from "@/components/admin/settings-form"

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.type !== 'admin') {
        redirect('/login')
    }

    // Buscar configurações atuais
    const settings = await prisma.configuracoes_sistema.findMany({
        where: {
            chave: {
                in: [
                    'system_name',
                    'system_url',
                    'system_logo',
                    'ui_primary_color',
                    'smtp_host',
                    'smtp_port',
                    'smtp_user',
                    'smtp_pass',
                    'smtp_from',
                    'banner_active',
                    'banner_text',
                    'banner_color',
                    'seo_title_suffix',
                    'seo_keywords'
                ]
            }
        }
    })

    // Converter para objeto { chave: valor }
    const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.chave] = curr.valor
        return acc
    }, {} as Record<string, string | null>)

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Configurações do Sistema</h1>
                <p className="text-muted-foreground">
                    Gerencie parâmetros globais da plataforma AgentiVerso.
                </p>
            </div>

            <SettingsForm initialSettings={settingsMap} />
        </div>
    )
}
