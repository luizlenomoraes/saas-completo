import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Verificar se é admin
    if (session.user.type !== 'admin') {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-muted/10">
            <AdminSidebar />
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                <AdminHeader />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
