import { cookies } from 'next/headers'
import { verifyMemberToken } from '@/lib/auth-member'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Play, BookOpen, Clock, Lock, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/ui/page-transition'

export const dynamic = 'force-dynamic'

export default async function MembersDashboard() {
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null

    if (!session) redirect('/members/login')

    // 1. Buscar TUDO: Cursos comprados e Cursos disponíveis na vitrine do produtor
    // Assumindo que o aluno está vinculado a um 'usuario_id' (produtor) através de sua primeira compra
    // Precisamos descobrir quem é o "dono" da escola desse aluno. 
    // Vamos pegar o primeiro produto que ele tem acesso para descobrir o produtor.

    const firstAccess = await prisma.alunos_acessos.findFirst({
        where: { email_aluno: session.email },
        select: { produtos: { select: { usuario_id: true } } }
    })

    if (!firstAccess) {
        // Caso raríssimo: aluno sem nenhum produto (talvez deletado). 
        return <div className="p-8 text-white">Erro: Nenhuma escola vinculada.</div>
    }

    const producerId = firstAccess.produtos.usuario_id

    // 2. Buscar TODOS os produtos desse produtor que são do tipo 'area_membros'
    const allProducts = await prisma.produtos.findMany({
        where: {
            usuario_id: producerId,
            tipo_entrega: 'area_membros',
            arquivado: false
        },
        include: {
            cursos: {
                include: {
                    modulos: {
                        include: { aulas: { select: { id: true } } }
                    }
                }
            }
        }
    })

    // 3. Buscar quais desses o aluno JÁ TEM
    const myAccesses = await prisma.alunos_acessos.findMany({
        where: {
            email_aluno: session.email,
            produto_id: { in: allProducts.map(p => p.id) }
        }
    })

    const myProductIds = myAccesses.map(a => a.produto_id)

    // 4. Processar dados para a view
    const coursesDisplay = await Promise.all(allProducts.map(async (produto) => {
        const hasAccess = myProductIds.includes(produto.id)
        const curso = produto.cursos

        let progress = 0
        let completedLessons = 0
        let totalLessons = 0

        if (curso) {
            totalLessons = curso.modulos.reduce((acc: number, mod: any) => acc + mod.aulas.length, 0)

            if (hasAccess) {
                const completedResults: any[] = await prisma.$queryRaw`
                    SELECT COUNT(*) as count FROM aluno_progresso
                    WHERE aluno_email = ${session.email}
                    AND aula_id IN (
                        SELECT a.id FROM aulas a
                        JOIN modulos m ON a.modulo_id = m.id
                        WHERE m.curso_id = ${curso.id}
                    )
                `
                completedLessons = parseInt(completedResults[0]?.count || '0')
                progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
            }
        }

        return {
            produto,
            curso,
            hasAccess,
            progress,
            totalLessons,
            completedLessons
        }
    }))

    // Ordenar: Comprados primeiro, depois Bloqueados
    coursesDisplay.sort((a, b) => (a.hasAccess === b.hasAccess ? 0 : a.hasAccess ? -1 : 1))

    const firstName = session.nome?.split(' ')[0] || 'Aluno'

    return (
        <PageTransition className="space-y-12">
            {/* Hero Welcome Section */}
            <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[2s]" />

                <div className="relative z-20 max-w-2xl space-y-6">
                    <Badge className="bg-[#D4AF37] text-black hover:bg-[#B5952F] border-none px-3 py-1 font-bold">
                        ÁREA DO ALUNO
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                        Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F6D764]">{firstName}</span>
                    </h1>
                    <p className="text-lg text-zinc-300 font-light max-w-lg">
                        Continue sua jornada. O conhecimento é o único investimento com retorno infinito.
                    </p>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="space-y-6">
                <h2 className="text-2xl font-serif text-white">Biblioteca de Cursos</h2>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {coursesDisplay.map(({ produto, hasAccess, totalLessons, completedLessons, progress }) => (
                        <div key={produto.id} className="group relative block h-full">

                            {/* Card Container */}
                            <div className={`glass-panel h-full rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 
                                ${hasAccess
                                    ? 'border-white/5 hover:border-[#D4AF37]/50 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.1)]'
                                    : 'border-white/5 opacity-80 hover:opacity-100 hover:border-white/20'
                                }`}>

                                {/* Link Wrapper (Condicional) */}
                                {hasAccess ? (
                                    <Link href={`/members/${produto.id}`} className="absolute inset-0 z-30" />
                                ) : (
                                    // Se não tem acesso, o link leva para a página de vendas ou checkout
                                    <Link href={`/checkout/${produto.checkout_hash || ''}`} target="_blank" className="absolute inset-0 z-30" />
                                )}

                                {/* Thumbnail */}
                                <div className="aspect-video relative overflow-hidden">
                                    <div className={`absolute inset-0 z-10 transition-colors ${hasAccess ? 'bg-black/20 group-hover:bg-black/0' : 'bg-black/60 grayscale group-hover:grayscale-0 transition-all duration-500'}`} />

                                    {produto.foto ? (
                                        <img src={produto.foto} alt={produto.nome} className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-zinc-700" />
                                        </div>
                                    )}

                                    {/* Overlay Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {hasAccess ? (
                                            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/90 flex items-center justify-center shadow-lg backdrop-blur-sm transform scale-50 group-hover:scale-100 transition-transform">
                                                <Play className="w-6 h-6 text-black fill-black ml-1" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm transform scale-50 group-hover:scale-100 transition-transform">
                                                <Lock className="w-6 h-6 text-black" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar (Apenas se tiver acesso) */}
                                    {hasAccess && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 z-20">
                                            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6D764]" style={{ width: `${progress}%` }} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${hasAccess ? 'border-[#D4AF37]/30 text-[#D4AF37]' : 'border-zinc-700 text-zinc-500'}`}>
                                                {hasAccess ? 'Disponível' : 'Bloqueado'}
                                            </Badge>
                                        </div>
                                        {!hasAccess && (
                                            <ShoppingCart className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                        )}
                                    </div>

                                    <h3 className={`text-xl font-bold mb-2 line-clamp-1 transition-colors ${hasAccess ? 'text-white group-hover:text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'}`}>
                                        {produto.nome}
                                    </h3>

                                    <p className="text-zinc-500 text-sm line-clamp-2 mb-6 font-light">
                                        {produto.descricao || 'Conteúdo exclusivo para membros.'}
                                    </p>

                                    {/* Footer Info */}
                                    {hasAccess ? (
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{completedLessons}/{totalLessons} Aulas</span>
                                            </div>
                                            <span className="text-sm font-bold text-white">{progress}%</span>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t border-white/5">
                                            <Button className="w-full bg-white/5 hover:bg-white/20 text-white border border-white/10">
                                                Desbloquear Acesso
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PageTransition>
    )
}
