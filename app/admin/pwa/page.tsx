import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PwaConfigForm } from "@/components/admin/pwa/pwa-config-form"

export default async function PwaAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.type !== 'admin') redirect('/login')

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Configuração PWA (App Mobile)</h1>
            <p className="text-zinc-400 mb-6">Configure a aparência e as notificações do Aplicativo Web Progressivo.</p>
            <PwaConfigForm />
        </div>
    )
}
