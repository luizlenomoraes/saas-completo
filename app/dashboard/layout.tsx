import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#050505] text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 relative">
                {/* Glow de Fundo Geral */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
                </div>

                <Header />

                <main className="flex-1 p-6 overflow-y-auto relative z-10 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    )
}
