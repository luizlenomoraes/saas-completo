'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X, Bot, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    async function handleLogout() {
        document.cookie = 'member_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-[#D4AF37] selection:text-black">
            {/* Ambient Glow Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header Glassmorphism */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-20 flex items-center justify-between">
                        {/* Logo Premium */}
                        <Link
                            href="/members"
                            className="group flex items-center gap-3 hover:opacity-100 transition-opacity"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F6D764] text-black shadow-lg">
                                    <Bot className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-serif font-bold text-white tracking-wide">Agenti<span className="text-[#D4AF37]">Verso</span></span>
                                <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-medium">Academy</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                href="/members"
                                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Meus Cursos
                            </Link>
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-2 rounded-full px-4 border border-transparent hover:border-red-500/20 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>

                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu Overlay */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-[#0a0a0a] border-b border-white/10 p-4 animate-fade-in shadow-2xl">
                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/members"
                                className="px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Meus Cursos
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
                {children}
            </main>

            {/* Footer Minimalista */}
            <footer className="relative z-10 border-t border-white/5 bg-[#050505] mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-xs text-zinc-600 font-light tracking-wide">
                        © {new Date().getFullYear()} AgentiVerso Academy. Excellence in Learning.
                    </p>
                </div>
            </footer>
        </div>
    )
}
