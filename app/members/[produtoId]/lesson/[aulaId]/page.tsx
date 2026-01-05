import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyMemberToken } from '@/lib/auth-member'
import { VideoPlayer } from '@/components/members/video-player'
import { LessonCompleteButton } from '@/components/members/lesson-complete-button'
import { LessonFilesList } from '@/components/members/lesson-files-list'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Download, Lock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function LessonPage({
    params
}: {
    params: { produtoId: string, aulaId: string }
}) {
    const { produtoId, aulaId } = params

    // Verificar sessão
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null

    if (!session) {
        redirect('/login')
    }

    // 1. Buscar a aula atual com arquivos
    const aula = await prisma.aulas.findUnique({
        where: { id: aulaId },
        include: {
            modulos: { include: { cursos: true } },
            aula_arquivos: { orderBy: { ordem: 'asc' } }
        }
    })

    if (!aula) {
        return <div className="p-8 text-center">Aula não encontrada</div>
    }

    // 2. Verificar acesso e data_acesso para release_days
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

    // Verificar liberação por tempo
    const moduloReleaseDays = aula.modulos.release_days || 0
    const aulaReleaseDays = aula.release_days || 0
    const maxReleaseDays = Math.max(moduloReleaseDays, aulaReleaseDays)
    const isLocked = diasDesdeAcesso < maxReleaseDays
    const diasRestantes = maxReleaseDays - diasDesdeAcesso

    // 3. Verificar progresso atual
    const progress: any[] = await prisma.$queryRaw`
        SELECT id FROM aluno_progresso
        WHERE aluno_email = ${session.email}
        AND aula_id = ${aulaId}
    `
    const isCompleted = progress.length > 0

    // 4. Buscar navegação (proxima/anterior)
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

    // Planificar a lista de aulas com verificação de release
    const flatLessons: any[] = []
    if (curso) {
        curso.modulos.forEach((mod: any) => {
            mod.aulas.forEach((a: any) => {
                const aulaMaxRelease = Math.max(mod.release_days || 0, a.release_days || 0)
                flatLessons.push({
                    ...a,
                    isLocked: diasDesdeAcesso < aulaMaxRelease
                })
            })
        })
    }

    const currentIndex = flatLessons.findIndex((l: any) => l.id === aulaId)
    const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null

    // Se a aula está bloqueada, mostrar mensagem
    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-md w-full">
                    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                        <Lock className="h-5 w-5" />
                        <AlertTitle className="text-lg">Conteúdo Bloqueado</AlertTitle>
                        <AlertDescription className="mt-2">
                            Esta aula será liberada em <strong>{diasRestantes} dia(s)</strong>.<br />
                            Continue assistindo as aulas já disponíveis enquanto isso.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 flex gap-2 justify-center">
                        {prevLesson && !prevLesson.isLocked && (
                            <Button variant="outline" asChild>
                                <Link href={`/members/${produtoId}/lesson/${prevLesson.id}`}>
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Aula Anterior
                                </Link>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href="/members">
                                Voltar aos Cursos
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Player Area */}
            <div className="bg-black w-full shadow-lg">
                <div className="max-w-5xl mx-auto">
                    <VideoPlayer
                        url={aula.url_video || ''}
                        title={aula.titulo}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto w-full p-6 space-y-6">

                {/* Header, Progress e Navigation */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{aula.titulo}</h1>
                        <p className="text-muted-foreground">{aula.modulos.titulo}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <LessonCompleteButton aulaId={aulaId} isCompleted={isCompleted} />

                        <div className="flex items-center gap-2 ml-2">
                            <Button variant="outline" size="sm" disabled={!prevLesson || prevLesson.isLocked} asChild={prevLesson && !prevLesson.isLocked}>
                                {prevLesson && !prevLesson.isLocked ? (
                                    <Link href={`/members/${produtoId}/lesson/${prevLesson.id}`}>
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Anterior
                                    </Link>
                                ) : (
                                    <span><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</span>
                                )}
                            </Button>
                            <Button size="sm" disabled={!nextLesson || nextLesson.isLocked} asChild={nextLesson && !nextLesson.isLocked}>
                                {nextLesson && !nextLesson.isLocked ? (
                                    <Link href={`/members/${produtoId}/lesson/${nextLesson.id}`}>
                                        Próxima
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                ) : (
                                    <span>Próxima <ChevronRight className="w-4 h-4 ml-1" /></span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Descrição */}
                <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold mb-2">Sobre esta aula</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {aula.descricao || 'Nenhuma descrição disponível para esta aula.'}
                    </p>
                </div>

                {/* Materiais/Arquivos */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Materiais Complementares
                    </h3>
                    <LessonFilesList files={aula.aula_arquivos} />
                </div>
            </div>
        </div>
    )
}
