'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CheckCircle2, Play, Lock, Menu, Bot, ChevronDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

interface CourseSidebarProps {
    curso: any
    produtoId: string
    diasDesdeAcesso?: number
    progressoIds?: string[]
}

export function CourseSidebar({ curso, produtoId, diasDesdeAcesso = 0, progressoIds = [] }: CourseSidebarProps) {
    const pathname = usePathname()
    const [progress, setProgress] = useState<string[]>(progressoIds)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        fetch(`/api/members/progress?produtoId=${produtoId}`)
            .then(res => res.json())
            .then(data => {
                if (data.progresso) setProgress(data.progresso.map((p: any) => p.aula_id))
            })
            .catch(console.error)
    }, [produtoId])

    const totalAulas = curso.modulos.reduce((acc: number, m: any) => acc + m.aulas.length, 0)
    const aulasCompletas = progress.length
    const porcentagem = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0
    const defaultValue = curso.modulos.length > 0 ? curso.modulos[0].id : undefined

    const SidebarContent = () => (
        <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-white/5 w-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/5 bg-[#050505]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                        <Bot className="w-6 h-6" />
                    </div>
                    <span className="font-serif font-bold text-white tracking-wide">
                        Agenti<span className="text-[#D4AF37]">Verso</span>
                    </span>
                </div>

                <h2 className="font-medium text-white line-clamp-2 text-sm leading-relaxed mb-4">
                    {curso.titulo}
                </h2>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold">
                        <span className="text-zinc-500">Progresso do Curso</span>
                        <span className="text-[#D4AF37]">{porcentagem}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
                            style={{ width: `${porcentagem}%` }}
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={[defaultValue]} className="w-full">
                    {curso.modulos.map((modulo: any, index: number) => {
                        const moduloLocked = diasDesdeAcesso < (modulo.release_days || 0)
                        const aulasDoModulo = modulo.aulas.length
                        const aulasCompletasModulo = modulo.aulas.filter((a: any) => progress.includes(a.id)).length

                        return (
                            <AccordionItem key={modulo.id} value={modulo.id} className="border-b border-white/5">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-white/[0.02] transition-colors group">
                                    <div className="text-left flex-1">
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                                            Módulo {index + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {moduloLocked && <Lock className="h-3 w-3 text-zinc-600" />}
                                            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                                                {modulo.titulo}
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-0 bg-black/20">
                                    <div className="flex flex-col">
                                        {modulo.aulas.map((aula: any) => {
                                            const isActive = pathname.includes(`/lesson/${aula.id}`)
                                            const isCompleted = progress.includes(aula.id)
                                            const aulaReleaseDays = Math.max(modulo.release_days || 0, aula.release_days || 0)
                                            const isLocked = diasDesdeAcesso < aulaReleaseDays

                                            return (
                                                <Link
                                                    key={aula.id}
                                                    href={isLocked ? '#' : `/members/${produtoId}/lesson/${aula.id}`}
                                                    onClick={(e) => isLocked && e.preventDefault()}
                                                    className={cn(
                                                        "relative flex items-center gap-3 pl-8 pr-6 py-4 text-sm transition-all border-l-2",
                                                        isActive
                                                            ? "bg-[#D4AF37]/5 text-white border-[#D4AF37]"
                                                            : "text-zinc-400 border-transparent hover:text-white hover:bg-white/5",
                                                        isCompleted && !isActive && "text-zinc-300",
                                                        isLocked && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
                                                    )}
                                                >
                                                    <div className="flex-shrink-0">
                                                        {isLocked ? (
                                                            <Lock className="h-4 w-4" />
                                                        ) : isCompleted ? (
                                                            <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                                                        ) : (
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full border flex items-center justify-center",
                                                                isActive ? "border-[#D4AF37] bg-[#D4AF37]" : "border-zinc-600"
                                                            )}>
                                                                {isActive && <Play className="w-2 h-2 text-black fill-black ml-0.5" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="line-clamp-2 leading-relaxed">{aula.titulo}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </ScrollArea>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <SidebarContent />
            </div>

            {/* Mobile Sheet */}
            <div className="md:hidden fixed top-[80px] right-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="default" size="sm" className="bg-[#D4AF37] text-black hover:bg-[#B5952F] shadow-lg shadow-[#D4AF37]/20">
                            <Menu className="h-4 w-4 mr-2" />
                            Aulas
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#0a0a0a] w-80 border-r border-white/10">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
