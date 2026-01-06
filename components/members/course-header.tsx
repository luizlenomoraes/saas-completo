'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CourseHeaderProps {
    cursoTitulo?: string
}

export function CourseHeader({ cursoTitulo }: CourseHeaderProps) {
    const router = useRouter()

    async function handleLogout() {
        document.cookie = 'member_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="fixed top-0 left-0 right-0 md:left-80 z-40 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="h-full px-4 flex items-center justify-between">
                {/* Logo / Link para cursos */}
                <Link
                    href="/members"
                    className="font-bold text-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F6D764] text-black">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gradient-gold leading-none text-sm">AgentiVerso</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-normal">Área do Aluno</span>
                    </div>
                </Link>

                {/* Título do curso (Desktop) */}
                {cursoTitulo && (
                    <div className="hidden md:flex items-center text-sm text-muted-foreground">
                        Meus Cursos
                    </div>
                )}

                {/* Botão Sair */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sair</span>
                </Button>
            </div>
        </header>
    )
}
