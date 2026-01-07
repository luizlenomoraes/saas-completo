import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#050505] text-white">
            <AdminSidebar />
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 relative">
                {/* Glow de Fundo (Admin Theme - Um pouco mais sóbrio, mas luxuoso) */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
                </div>

                <AdminHeader />

                <main className="flex-1 p-6 overflow-y-auto relative z-10 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    )
}
