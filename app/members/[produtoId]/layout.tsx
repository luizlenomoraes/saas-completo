import { verifyMemberToken } from '@/lib/auth-member'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CourseSidebar } from '@/components/members/course-sidebar'

export default async function CourseLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: { produtoId: string }
}) {
    const cookieStore = cookies()
    const token = cookieStore.get('member_session')?.value
    const session: any = token ? await verifyMemberToken(token) : null

    if (!session) {
        redirect('/login')
    }

    const produtoId = params.produtoId

    // Validar acesso e obter data_acesso
    const accesses: any[] = await prisma.$queryRaw`
        SELECT id, data_acesso FROM alunos_acessos 
        WHERE email_aluno = ${session.email} 
        AND produto_id = ${produtoId}
    `

    if (accesses.length === 0) {
        return redirect('/members')
    }

    // Calcular dias desde o acesso
    const dataAcesso = new Date(accesses[0].data_acesso)
    const agora = new Date()
    const diasDesdeAcesso = Math.floor((agora.getTime() - dataAcesso.getTime()) / (1000 * 60 * 60 * 24))

    const curso = await prisma.cursos.findFirst({
        where: { produto_id: produtoId },
        include: {
            modulos: {
                include: { aulas: { orderBy: { ordem: 'asc' } } },
                orderBy: { ordem: 'asc' }
            }
        }
    })

    if (!curso) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Conteúdo não encontrado</h2>
                <p className="text-muted-foreground">O curso para este produto ainda não foi criado.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <CourseSidebar
                curso={curso}
                produtoId={produtoId}
                diasDesdeAcesso={diasDesdeAcesso}
            />
            <main className="md:pl-80 h-full transition-all">
                {children}
            </main>
        </div>
    )
}
