'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CheckCircle, PlayCircle, Lock, Menu } from 'lucide-react'
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
    diasDesdeAcesso?: number // Dias desde a data de acesso do aluno
    progressoIds?: string[] // IDs das aulas concluídas
}

export function CourseSidebar({ curso, produtoId, diasDesdeAcesso = 0, progressoIds = [] }: CourseSidebarProps) {
    const pathname = usePathname()
    const [progress, setProgress] = useState<string[]>(progressoIds)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        // Buscar progresso do servidor
        fetch(`/api/members/progress?produtoId=${produtoId}`)
            .then(res => res.json())
            .then(data => {
                if (data.progresso) {
                    setProgress(data.progresso.map((p: any) => p.aula_id))
                }
            })
            .catch(console.error)
    }, [produtoId])

    // Contar total de aulas e aulas concluídas
    const totalAulas = curso.modulos.reduce((acc: number, m: any) => acc + m.aulas.length, 0)
    const aulasCompletas = progress.length
    const porcentagem = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0

    const defaultValue = curso.modulos.length > 0 ? curso.modulos[0].id : undefined

    const SidebarContent = () => (
        <div className="h-full flex flex-col border-r bg-white dark:bg-gray-950 w-full">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg line-clamp-1" title={curso.titulo}>
                    {curso.titulo}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {totalAulas} aulas • {aulasCompletas} concluídas
                </p>
                {/* Barra de Progresso */}
                <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-primary">{porcentagem}%</span>
                    </div>
                    <Progress value={porcentagem} className="h-2" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={[defaultValue]} className="w-full">
                    {curso.modulos.map((modulo: any) => {
                        // Verificar se o módulo está bloqueado
                        const moduloLocked = diasDesdeAcesso < (modulo.release_days || 0)
                        const aulasDoModulo = modulo.aulas.length
                        const aulasCompletasModulo = modulo.aulas.filter((a: any) => progress.includes(a.id)).length

                        return (
                            <AccordionItem key={modulo.id} value={modulo.id}>
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <div className="text-left flex-1">
                                        <div className="flex items-center gap-2">
                                            {moduloLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                            <span className={cn("text-sm font-medium", moduloLocked && "text-muted-foreground")}>
                                                {modulo.titulo}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground block font-normal">
                                            {aulasCompletasModulo}/{aulasDoModulo} aulas
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-0">
                                    <div className="flex flex-col">
                                        {modulo.aulas.map((aula: any) => {
                                            const isActive = pathname.includes(`/lesson/${aula.id}`)
                                            const isCompleted = progress.includes(aula.id)

                                            // Verificar release_days da aula e do módulo
                                            const aulaReleaseDays = Math.max(modulo.release_days || 0, aula.release_days || 0)
                                            const isLocked = diasDesdeAcesso < aulaReleaseDays

                                            return (
                                                <Link
                                                    key={aula.id}
                                                    href={isLocked ? '#' : `/members/${produtoId}/lesson/${aula.id}`}
                                                    onClick={(e) => isLocked && e.preventDefault()}
                                                    className={cn(
                                                        "flex items-center gap-x-2 text-sm font-medium pl-6 pr-4 py-3 transition-all hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                                                        isActive && "bg-slate-100 dark:bg-slate-800 text-primary border-r-2 border-primary",
                                                        isCompleted && !isActive && "text-emerald-700",
                                                        isLocked && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-inherit"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-x-2 w-full">
                                                        {isLocked ? (
                                                            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        ) : isCompleted ? (
                                                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        ) : (
                                                            <PlayCircle className={cn("h-4 w-4 shrink-0", isActive ? "fill-primary text-white" : "text-slate-500")} />
                                                        )}
                                                        <span className="line-clamp-1">{aula.titulo}</span>
                                                    </div>
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

            {/* Link para voltar */}
            <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/members">
                        ← Voltar aos Cursos
                    </Link>
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50 mt-16">
                <SidebarContent />
            </div>

            {/* Mobile Sheet */}
            <div className="md:hidden fixed top-[70px] right-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-white shadow-md">
                            <Menu className="h-4 w-4 mr-2" />
                            Aulas
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-white w-80">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
