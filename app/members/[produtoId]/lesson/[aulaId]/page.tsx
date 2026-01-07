import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyMemberToken } from '@/lib/auth-member'
import { VideoPlayer } from '@/components/members/video-player'
import { LessonCompleteButton } from '@/components/members/lesson-complete-button'
import { LessonFilesList } from '@/components/members/lesson-files-list'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Download, Lock, Info, FileText } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CommentsSection } from '@/components/members/comments-section'

export default async function LessonPage({
    params
}: {
    params: { produtoId: string, aulaId: string }
}) {
    const { produtoId, aulaId } = params

    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null
    if (!session) redirect('/login')

    const aula = await prisma.aulas.findUnique({
        where: { id: aulaId },
        include: {
            modulos: { include: { cursos: true } },
            aula_arquivos: { orderBy: { ordem: 'asc' } }
        }
    })

    if (!aula) return <div className="p-8 text-center text-white">Aula não encontrada</div>

    // Verificação de Acesso e Lock (Mantida intacta)
    const accessData: any[] = await prisma.$queryRaw`
        SELECT data_acesso FROM alunos_acessos
        WHERE email_aluno = ${session.email}
        AND produto_id = ${produtoId}
        LIMIT 1
    `
    if (accessData.length === 0) redirect('/members')

    const dataAcesso = new Date(accessData[0].data_acesso)
    const agora = new Date()
    const diasDesdeAcesso = Math.floor((agora.getTime() - dataAcesso.getTime()) / (1000 * 60 * 60 * 24))

    const moduloReleaseDays = aula.modulos.release_days || 0
    const aulaReleaseDays = aula.release_days || 0
    const maxReleaseDays = Math.max(moduloReleaseDays, aulaReleaseDays)
    const isLocked = diasDesdeAcesso < maxReleaseDays
    const diasRestantes = maxReleaseDays - diasDesdeAcesso

    const progress: any[] = await prisma.$queryRaw`
        SELECT id FROM aluno_progresso
        WHERE aluno_email = ${session.email} AND aula_id = ${aulaId}
    `
    const isCompleted = progress.length > 0

    // Navegação
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

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center border border-white/5">
                    <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Lock className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Conteúdo em Breve</h2>
                    <p className="text-zinc-400 mb-6">
                        Esta aula será liberada em <span className="text-[#D4AF37] font-bold">{diasRestantes} dia(s)</span>.
                    </p>
                    <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
                        <Link href="/members">Voltar aos Cursos</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Player Area - Cinema Mode */}
            <div className="w-full bg-black relative">
                {/* Glow Effect behind player */}
                <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[100px] pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <VideoPlayer
                        url={aula.url_video || ''}
                        title={aula.titulo}
                        onEnded={undefined} // Pode adicionar lógica de auto-complete aqui
                        watermarkText={session.email}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1400px] mx-auto w-full p-6 md:p-8 space-y-8">

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-[10px] tracking-widest uppercase">
                                Aula {currentIndex + 1}
                            </Badge>
                            <span className="text-zinc-500 text-sm">{aula.modulos.titulo}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{aula.titulo}</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            disabled={!prevLesson || prevLesson.isLocked}
                            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 bg-transparent"
                            asChild={prevLesson && !prevLesson.isLocked}
                        >
                            {prevLesson && !prevLesson.isLocked ? (
                                <Link href={`/members/${produtoId}/lesson/${prevLesson.id}`}>
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                                </Link>
                            ) : (
                                <span><ChevronLeft className="w-4 h-4 mr-2" /> Anterior</span>
                            )}
                        </Button>

                        <LessonCompleteButton aulaId={aulaId} isCompleted={isCompleted} />

                        <Button
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            disabled={!nextLesson || nextLesson.isLocked}
                            asChild={nextLesson && !nextLesson.isLocked}
                        >
                            {nextLesson && !nextLesson.isLocked ? (
                                <Link href={`/members/${produtoId}/lesson/${nextLesson.id}`}>
                                    Próxima <ChevronRight className="w-4 h-4 ml-2" />
                                </Link>
                            ) : (
                                <span>Próxima <ChevronRight className="w-4 h-4 ml-2" /></span>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Descrição */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-white font-medium text-lg">
                            <Info className="w-5 h-5 text-[#D4AF37]" />
                            <h2>Sobre esta aula</h2>
                        </div>
                        <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none leading-relaxed">
                            <p className="whitespace-pre-line">{aula.descricao || 'Nenhuma descrição disponível para esta aula.'}</p>
                        </div>
                    </div>

                    {/* Sidebar de Arquivos */}
                    <div className="md:col-span-1">
                        <div className="glass-panel rounded-xl p-6 border border-white/5 sticky top-24">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#D4AF37]" />
                                Materiais de Apoio
                            </h3>

                            {aula.aula_arquivos && aula.aula_arquivos.length > 0 ? (
                                <LessonFilesList files={aula.aula_arquivos} />
                            ) : (
                                <div className="text-center py-8 text-zinc-600 text-sm">
                                    <p>Nenhum material complementar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seção de Comentários */}
                <div className="pt-8 border-t border-white/5">
                    <CommentsSection aulaId={aulaId} />
                </div>
            </div>
        </div>
    )
}
