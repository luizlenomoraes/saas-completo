import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function StudentsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Buscar produtos do infoprodutor
    const produtos = await prisma.produtos.findMany({
        where: { usuario_id: session.user.id },
        select: { id: true, nome: true }
    })

    const produtoIds = produtos.map(p => p.id)

    // Buscar alunos com acesso aos produtos deste infoprodutor
    const acessos = await prisma.alunos_acessos.findMany({
        where: { produto_id: { in: produtoIds } },
        include: {
            produtos: { select: { id: true, nome: true } }
        },
        orderBy: { data_acesso: 'desc' }
    })

    // Agrupar por email para mostrar alunos únicos com seus produtos
    const alunosMap = new Map<string, { email: string; produtos: string[]; dataAcesso: Date }>()

    acessos.forEach(acesso => {
        const existing = alunosMap.get(acesso.email_aluno)
        if (existing) {
            existing.produtos.push(acesso.produtos.nome)
        } else {
            alunosMap.set(acesso.email_aluno, {
                email: acesso.email_aluno,
                produtos: [acesso.produtos.nome],
                dataAcesso: acesso.data_acesso
            })
        }
    })

    const alunos = Array.from(alunosMap.values())

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
                <p className="text-muted-foreground">
                    Gerencie os alunos com acesso aos seus produtos
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alunos.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acessos Totais</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acessos.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produtos com Alunos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(acessos.map(a => a.produto_id)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {alunos.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum aluno ainda</h3>
                        <p className="text-muted-foreground">
                            Quando suas vendas forem aprovadas, os alunos aparecerão aqui
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Alunos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alunos.map((aluno, index) => (
                                <div
                                    key={aluno.email}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary">
                                                {aluno.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{aluno.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    Acesso em {format(aluno.dataAcesso, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-w-[300px] justify-end">
                                        {aluno.produtos.map((produto, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {produto}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
