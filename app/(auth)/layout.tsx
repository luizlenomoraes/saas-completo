// app/(auth)/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Bot, CheckCircle2 } from 'lucide-react'

interface AuthLayoutProps {
    children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
    const session = await getServerSession(authOptions)

    if (session) {
        switch (session.user.type) {
            case 'ADMIN': redirect('/admin'); break
            case 'MEMBER': redirect('/member'); break
            default: redirect('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex bg-[#050505] text-white overflow-hidden">
            {/* Lado esquerdo - Branding de Luxo */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] border-r border-[#D4AF37]/10">
                {/* Efeitos de Fundo (Glow) */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 w-full flex flex-col justify-center items-center p-16">
                    <div className="max-w-lg">
                        <div className="mb-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#F6D764] rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_-5px_rgba(212,175,55,0.3)]">
                                <Bot className="w-8 h-8 text-black" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-5xl font-serif font-medium mb-6 leading-tight">
                                Domine seu <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F6D764]">
                                    Império Digital
                                </span>
                            </h1>
                            <p className="text-xl text-zinc-400 font-light leading-relaxed">
                                A plataforma definitiva para quem joga o jogo do high-ticket. Conversão, elegância e performance em um só lugar.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                "Checkout de Ultra-Conversão",
                                "Área de Membros Netflix-Style",
                                "Dashboard Financeiro em Tempo Real"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors duration-500">
                                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37] group-hover:text-black transition-colors" />
                                    </div>
                                    <span className="text-zinc-300 font-light group-hover:text-white transition-colors">
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado direito - Formulários */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
                {/* Mobile Glow */}
                <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[80px]" />
                </div>

                <div className="w-full max-w-md animate-fade-up relative z-10">
                    {children}
                </div>

                <div className="mt-12 text-center text-xs text-zinc-600">
                    <p>© {new Date().getFullYear()} AgentiVerso. Excellence in Code.</p>
                </div>
            </div>
        </div>
    )
}
