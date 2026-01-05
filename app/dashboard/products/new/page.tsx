'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [preco, setPreco] = useState('')
    const [precoAnterior, setPrecoAnterior] = useState('')
    const [tipoEntrega, setTipoEntrega] = useState('link')
    const [gateway, setGateway] = useState('mercadopago')
    const [conteudoEntrega, setConteudoEntrega] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        if (!nome || !preco) {
            setError('Nome e preço são obrigatórios')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    descricao,
                    preco: parseFloat(preco),
                    preco_anterior: precoAnterior ? parseFloat(precoAnterior) : null,
                    tipo_entrega: tipoEntrega,
                    gateway,
                    conteudo_entrega: tipoEntrega === 'link' ? conteudoEntrega : null
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao criar produto')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push(`/dashboard/products/${data.produtoId}`)
            }, 1500)
        } catch (err: any) {
            setError(err.message || 'Erro ao criar produto')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Produto Criado!</h2>
                        <p className="text-muted-foreground">Redirecionando para edição...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/products">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
                    <p className="text-muted-foreground">
                        Crie um novo produto para vender
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Básicas</CardTitle>
                                <CardDescription>
                                    Dados principais do seu produto
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome do Produto *</Label>
                                    <Input
                                        id="nome"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Ex: Curso de Marketing Digital"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="descricao">Descrição</Label>
                                    <Textarea
                                        id="descricao"
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        placeholder="Descreva seu produto..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Preço</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="preco">Preço de Venda (R$) *</Label>
                                        <Input
                                            id="preco"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={preco}
                                            onChange={(e) => setPreco(e.target.value)}
                                            placeholder="297.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="precoAnterior">Preço Anterior (R$)</Label>
                                        <Input
                                            id="precoAnterior"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precoAnterior}
                                            onChange={(e) => setPrecoAnterior(e.target.value)}
                                            placeholder="497.00"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Aparece riscado no checkout para mostrar desconto
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Entrega do Produto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Entrega</Label>
                                    <Select value={tipoEntrega} onValueChange={setTipoEntrega}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="link">Link de Acesso</SelectItem>
                                            <SelectItem value="email_pdf">Email com PDF</SelectItem>
                                            <SelectItem value="area_membros">Área de Membros</SelectItem>
                                            <SelectItem value="produto_fisico">Produto Físico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {tipoEntrega === 'link' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="conteudo">Link de Entrega</Label>
                                        <Input
                                            id="conteudo"
                                            value={conteudoEntrega}
                                            onChange={(e) => setConteudoEntrega(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                {tipoEntrega === 'area_membros' && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-800">
                                            📚 Um curso será criado automaticamente para este produto.
                                            Você poderá adicionar módulos e aulas depois.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gateway de Pagamento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={gateway} onValueChange={setGateway}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                                        <SelectItem value="pushinpay">PushinPay</SelectItem>
                                        <SelectItem value="efi">Efí (Gerencianet)</SelectItem>
                                        <SelectItem value="beehive">Beehive</SelectItem>
                                        <SelectItem value="hypercash">Hypercash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            <Package className="w-4 h-4 mr-2" />
                                            Criar Produto
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
