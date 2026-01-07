'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, LogOut, ChevronLeft } from 'lucide-react'
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
        <header className="fixed top-0 left-0 right-0 md:left-80 z-40 h-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
            <div className="h-full px-6 flex items-center justify-between">

                {/* Mobile: Logo reduzido / Desktop: Título do Curso */}
                <div className="flex items-center gap-4">
                    <Link href="/members" className="md:hidden">
                        <div className="p-1.5 rounded-lg bg-[#D4AF37] text-black">
                            <Bot className="w-5 h-5" />
                        </div>
                    </Link>

                    <div className="hidden md:flex flex-col">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Assistindo agora</span>
                        <h1 className="text-white font-medium text-sm md:text-base line-clamp-1 text-[#D4AF37]">
                            {cursoTitulo || 'Carregando...'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        <Link href="/members">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Meus Cursos</span>
                        </Link>
                    </Button>

                    <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sair</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
