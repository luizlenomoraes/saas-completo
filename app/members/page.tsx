import { cookies } from 'next/headers'
import { verifyMemberToken } from '@/lib/auth-member'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlayCircle, BookOpen, GraduationCap, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function MembersDashboard() {
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null

    if (!session) {
        redirect('/members/login')
    }

    // Buscando os cursos do aluno
    const accesses = await prisma.alunos_acessos.findMany({
        where: { email_aluno: session.email },
        include: {
            produtos: {
                include: {
                    cursos: {
                        include: {
                            modulos: {
                                include: {
                                    aulas: { select: { id: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // Filtrar produtos que tenham área de membros
    const validAccesses = accesses.filter((access: any) => access.produtos.tipo_entrega === 'area_membros')

    // Calcular progresso de cada curso
    const coursesWithProgress = await Promise.all(
        validAccesses.map(async (access: any) => {
            const produto = access.produtos
            const curso = produto.cursos

            if (!curso) {
                return { access, totalLessons: 0, completedLessons: 0, progress: 0 }
            }

            // Contar total de aulas
            const totalLessons = curso.modulos.reduce((acc: number, mod: any) => acc + mod.aulas.length, 0)

            // Buscar progresso do aluno
            const completedResults: any[] = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM aluno_progresso
                WHERE aluno_email = ${session.email}
                AND aula_id IN (
                    SELECT a.id FROM aulas a
                    JOIN modulos m ON a.modulo_id = m.id
                    WHERE m.curso_id = ${curso.id}
                )
            `
            const completedLessons = parseInt(completedResults[0]?.count || '0')
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

            return { access, totalLessons, completedLessons, progress }
        })
    )

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
                        <p className="text-muted-foreground mt-1">
                            Bem-vindo de volta! Continue de onde parou.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span><strong>{coursesWithProgress.length}</strong> curso(s) disponível(is)</span>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {coursesWithProgress.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Você ainda não possui cursos</p>
                    <p className="text-sm text-slate-500 mt-1">Seus cursos aparecerão aqui após a compra</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {coursesWithProgress.map(({ access, totalLessons, completedLessons, progress }: any) => {
                        const produto = access.produtos
                        const curso = produto.cursos

                        return (
                            <Card
                                key={access.id}
                                className="group flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative overflow-hidden">
                                    {produto.foto ? (
                                        <img
                                            src={produto.foto}
                                            alt={produto.nome}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="w-10 h-10 text-primary/50" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress overlay */}
                                    {progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="pb-3">
                                    <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                                        {produto.nome}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        {curso && (
                                            <Badge variant="secondary" className="text-xs">
                                                {curso.modulos?.length || 0} Módulos
                                            </Badge>
                                        )}
                                        {totalLessons > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {totalLessons} Aulas
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 pb-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {produto.descricao || 'Acesse o conteúdo completo do curso.'}
                                    </p>

                                    {/* Progress info */}
                                    {totalLessons > 0 && (
                                        <div className="mt-4 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {completedLessons} de {totalLessons} aulas concluídas
                                            </span>
                                            <span className={`font-semibold ${progress === 100 ? 'text-green-600' : 'text-primary'}`}>
                                                {progress}%
                                            </span>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-0">
                                    <Button className="w-full gap-2 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow" asChild>
                                        <Link href={`/members/${produto.id}`}>
                                            <PlayCircle className="w-4 h-4" />
                                            {progress > 0 ? 'Continuar' : 'Começar'}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
