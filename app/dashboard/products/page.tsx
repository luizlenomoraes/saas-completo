import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ProductActions } from '@/components/dashboard/product-actions'

export default async function ProductsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Buscar produtos do infoprodutor
    const produtos = await prisma.produtos.findMany({
        where: { usuario_id: session.user.id },
        orderBy: { data_criacao: 'desc' },
        include: {
            _count: {
                select: { vendas: true }
            }
        }
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const getDeliveryBadge = (tipo: string) => {
        const types: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
            link: { label: 'Link', variant: 'outline' },
            email_pdf: { label: 'Email/PDF', variant: 'secondary' },
            area_membros: { label: 'Área de Membros', variant: 'default' },
            produto_fisico: { label: 'Físico', variant: 'outline' }
        }
        const config = types[tipo] || { label: tipo, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus produtos e páginas de checkout
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/products/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                    </Link>
                </Button>
            </div>

            {produtos.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
                        <p className="text-muted-foreground mb-4">
                            Crie seu primeiro produto para começar a vender
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/products/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Produto
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {produtos.map((produto) => (
                        <Card key={produto.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                            {/* Imagem do produto - clicável para editar */}
                            <Link href={`/dashboard/products/${produto.id}`} className="block">
                                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                                    {produto.foto ? (
                                        <img
                                            src={produto.foto}
                                            alt={produto.nome}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Se a imagem falhar, esconder e mostrar o ícone
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <Package className={`w-12 h-12 text-primary/30 absolute ${produto.foto ? 'hidden' : ''}`} />
                                    {/* Overlay de edição no hover */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="text-white flex items-center gap-2">
                                            <Edit className="w-5 h-5" />
                                            <span className="font-medium">Editar</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <Link href={`/dashboard/products/${produto.id}`} className="flex-1">
                                        <CardTitle className="text-lg line-clamp-1 hover:text-primary transition-colors">
                                            {produto.nome}
                                        </CardTitle>
                                    </Link>
                                    <ProductActions
                                        productId={produto.id}
                                        checkoutHash={produto.checkout_hash}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(Number(produto.preco))}
                                    </span>
                                    {produto.preco_anterior && (
                                        <span className="text-sm text-muted-foreground line-through">
                                            {formatCurrency(Number(produto.preco_anterior))}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {produto._count.vendas} vendas
                                    </span>
                                    {getDeliveryBadge(produto.tipo_entrega)}
                                </div>
                                {/* Botões de ação rápida */}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link href={`/dashboard/products/${produto.id}`}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/checkout/${produto.checkout_hash}`} target="_blank">
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
