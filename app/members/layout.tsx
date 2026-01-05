'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, GraduationCap, Menu, X, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    async function handleLogout() {
        document.cookie = 'member_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/members/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        {/* Logo */}
                        <Link
                            href="/members"
                            className="font-bold text-xl flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                            <div className="p-2 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F6D764] text-black shadow-lg shadow-[#D4AF37]/25">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gradient-gold leading-none">AgentiVerso</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">Área do Aluno</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="/members"
                                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                            >
                                Meus Cursos
                            </Link>
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>

                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 py-4 px-4">
                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/members"
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Meus Cursos
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-slate-500">
                        © {new Date().getFullYear()} Área do Aluno. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
