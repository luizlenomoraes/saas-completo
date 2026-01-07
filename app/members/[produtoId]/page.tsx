import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyMemberToken } from '@/lib/auth-member'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, CheckCircle, Lock, MonitorPlay, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'

export default async function CourseHomePage({ params }: { params: { produtoId: string } }) {
    const { produtoId } = params

    // Verificar sessão
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null

    if (!session) {
        redirect('/login')
    }

    // Buscar dados do curso e módulos
    const curso = await prisma.cursos.findFirst({
        where: { produto_id: produtoId },
        include: {
            modulos: {
                orderBy: { ordem: 'asc' },
                include: {
                    aulas: {
                        orderBy: { ordem: 'asc' },
                        select: { id: true, titulo: true, release_days: true }
                    }
                }
            }
        }
    })

    if (!curso) {
        return <div className="p-8 text-center text-muted-foreground">Curso não encontrado.</div>
    }

    // Verificar data de acesso do aluno (para release_days)
    const accessData: any[] = await prisma.$queryRaw`
        SELECT data_acesso FROM alunos_acessos
        WHERE email_aluno = ${session.email}
        AND produto_id = ${produtoId}
        LIMIT 1
    `

    if (accessData.length === 0) {
        redirect('/members')
    }

    const dataAcesso = new Date(accessData[0].data_acesso)
    const agora = new Date()
    const diasDesdeAcesso = Math.floor((agora.getTime() - dataAcesso.getTime()) / (1000 * 60 * 60 * 24))

    // Buscar progresso (aulas concluídas)
    const progressData: any[] = await prisma.$queryRaw`
        SELECT aula_id FROM aluno_progresso
        WHERE aluno_email = ${session.email}
    `
    const completedLessonIds = new Set(progressData.map(p => p.aula_id))

    // Processar dados para estatísticas e "Continue Watching"
    let totalLessons = 0
    let completedCount = 0
    let firstUncompletedLesson: any = null
    let firstLesson: any = null

    const modulesWithStatus = curso.modulos.map((modulo: any) => {
        const lessonsWithStatus = modulo.aulas.map((aula: any) => {
            totalLessons++

            const isCompleted = completedLessonIds.has(aula.id)
            if (isCompleted) completedCount++

            const moduloRelease = modulo.release_days || 0
            const aulaRelease = aula.release_days || 0
            const maxRelease = Math.max(moduloRelease, aulaRelease)
            const isLocked = diasDesdeAcesso < maxRelease
            const daysToUnlock = maxRelease - diasDesdeAcesso

            const lessonObj = { ...aula, isCompleted, isLocked, daysToUnlock }

            if (!firstLesson) firstLesson = lessonObj
            if (!isCompleted && !isLocked && !firstUncompletedLesson) {
                firstUncompletedLesson = lessonObj
            }

            return lessonObj
        })

        return {
            ...modulo,
            aulas: lessonsWithStatus
        }
    })

    const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const nextLesson = firstUncompletedLesson || firstLesson || null

    return (
        <div className="min-h-screen pb-12">
            {/* Hero Section */}
            <div className="relative w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
                {/* Background com gradiente ou imagem (se tivesse) */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 z-0" />

                {/* Efeito Glass Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
                    <div className="max-w-3xl space-y-6">
                        <Badge variant="outline" className="text-purple-300 border-purple-500/30 bg-purple-500/10 px-3 py-1">
                            Curso Completo
                        </Badge>

                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                            {curso.titulo}
                        </h1>

                        <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                            {curso.descricao || 'Bem-vindo ao curso. Prepare-se para dominar este conteúdo.'}
                        </p>

                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                                <span>Seu progresso</span>
                                <span className="text-white font-medium">{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2 bg-slate-700" />
                            <p className="text-xs text-slate-500">
                                {completedCount} de {totalLessons} aulas concluídas
                            </p>
                        </div>

                        <div className="pt-6 flex flex-wrap gap-4">
                            {nextLesson ? (
                                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-14 text-lg shadow-xl shadow-purple-900/20" asChild>
                                    <Link href={`/members/${produtoId}/lesson/${nextLesson.id}`}>
                                        <Play className="w-5 h-5 mr-3 fill-slate-900" />
                                        {progressPercentage > 0 ? 'Continuar de onde parou' : 'Começar Agora'}
                                    </Link>
                                </Button>
                            ) : (
                                <Button size="lg" disabled className="h-14">
                                    Em breve
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo do Curso - Lista de Módulos */}
            <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <MonitorPlay className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Conteúdo do Curso</h2>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {modulesWithStatus.map((modulo: any) => (
                            <AccordionItem key={modulo.id} value={modulo.id} className="border-b last:border-0 px-2">
                                <AccordionTrigger className="hover:no-underline py-5 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors group">
                                    <div className="flex text-left gap-4 flex-1 items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                            {modulesWithStatus.indexOf(modulo) + 1}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-semibold text-lg text-slate-800 dark:text-slate-200 block">
                                                {modulo.titulo}
                                            </span>
                                            <span className="text-sm text-slate-500 font-normal">
                                                {modulo.aulas.length} aulas
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 px-4">
                                    <div className="space-y-1 mt-2">
                                        {modulo.aulas.map((aula: any) => (
                                            <Link
                                                key={aula.id}
                                                href={aula.isLocked ? '#' : `/members/${produtoId}/lesson/${aula.id}`}
                                                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${aula.isLocked
                                                    ? 'opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/30'
                                                    : 'hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer'
                                                    }`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {aula.isLocked ? (
                                                        <Lock className="w-5 h-5 text-slate-400" />
                                                    ) : aula.isCompleted ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-500/10" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`font-medium truncate ${aula.isCompleted ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                                            {aula.titulo}
                                                        </span>
                                                        {aula.isLocked && (
                                                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                Libera em {aula.daysToUnlock} dias
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!aula.isLocked && (
                                                    <Play className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    )
}
