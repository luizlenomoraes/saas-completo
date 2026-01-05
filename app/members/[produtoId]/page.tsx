import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function CourseHomePage({ params }: { params: { produtoId: string } }) {
    const curso = await prisma.cursos.findFirst({
        where: { produto_id: params.produtoId },
        include: {
            modulos: {
                orderBy: { ordem: 'asc' },
                take: 1,
                include: { aulas: { orderBy: { ordem: 'asc' }, take: 1 } }
            }
        }
    })

    // Redireciona para a primeira aula do primeiro módulo
    if (curso && curso.modulos.length > 0 && curso.modulos[0].aulas.length > 0) {
        const primeiraAula = curso.modulos[0].aulas[0]
        redirect(`/members/${params.produtoId}/lesson/${primeiraAula.id}`)
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">{curso?.titulo}</h1>
            <p className="text-muted-foreground">Este curso ainda não possui aulas cadastradas.</p>
        </div>
    )
}
