'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    ArrowLeft, Loader2, Save, ExternalLink, Copy, Trash2,
    Plus, GripVertical, Video,
    BookOpen, Pencil, Clock, Tag
} from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/image-upload'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EditLessonDialog } from '@/components/dashboard/edit-lesson-dialog'
import { EditModuleDialog } from '@/components/dashboard/edit-module-dialog'
import { CheckoutEditor, CheckoutConfig, defaultCheckoutConfig } from '@/components/dashboard/checkout-editor'
import { OrderBumpManager } from '@/components/dashboard/bumps/order-bump-manager'

interface Aula {
    id: string
    titulo: string
    url_video: string | null
    descricao: string | null
    ordem: number
    release_days: number
}

interface Modulo {
    id: string
    titulo: string
    ordem: number
    release_days: number
    aulas: Aula[]
}

interface Curso {
    id: string
    titulo: string
    descricao: string | null
    modulos: Modulo[]
}

interface Produto {
    id: string
    nome: string
    descricao: string | null
    preco: number
    preco_anterior: number | null
    foto: string | null
    checkout_hash: string
    tipo_entrega: string
    conteudo_entrega: string | null
    gateway: string
    cursos: Curso | null
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [produto, setProduto] = useState<Produto | null>(null)

    // Form state
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [preco, setPreco] = useState('')
    const [precoAnterior, setPrecoAnterior] = useState('')
    const [tipoEntrega, setTipoEntrega] = useState('link')
    const [gateway, setGateway] = useState('mercadopago')
    const [conteudoEntrega, setConteudoEntrega] = useState('')
    const [foto, setFoto] = useState<string | null>(null)

    // Module/Lesson form
    const [newModuleTitle, setNewModuleTitle] = useState('')
    const [newLessonTitle, setNewLessonTitle] = useState('')
    const [newLessonModuleId, setNewLessonModuleId] = useState('')

    // Edit lesson state
    const [editingLesson, setEditingLesson] = useState<Aula | null>(null)
    const [isEditLessonOpen, setIsEditLessonOpen] = useState(false)
    const [newLessonUrl, setNewLessonUrl] = useState('')

    // Edit module state
    const [editingModule, setEditingModule] = useState<Modulo | null>(null)
    const [isEditModuleOpen, setIsEditModuleOpen] = useState(false)

    // Checkout Config
    const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig>(defaultCheckoutConfig)

    useEffect(() => {
        fetchProduct()
    }, [productId])

    async function fetchProduct() {
        try {
            const res = await fetch(`/api/products/${productId}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Produto não encontrado')
            }

            const p = data.produto
            setProduto(p)
            setNome(p.nome)
            setDescricao(p.descricao || '')
            setPreco(p.preco.toString())
            setPrecoAnterior(p.preco_anterior?.toString() || '')
            setTipoEntrega(p.tipo_entrega)
            setGateway(p.gateway)
            setConteudoEntrega(p.conteudo_entrega || '')
            setFoto(p.foto || null)
            if (p.checkout_config) {
                setCheckoutConfig(p.checkout_config as unknown as CheckoutConfig)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave() {
        setIsSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    descricao,
                    preco,
                    preco_anterior: precoAnterior || null,
                    tipo_entrega: tipoEntrega,
                    gateway,
                    conteudo_entrega: conteudoEntrega,
                    foto,
                    checkout_config: checkoutConfig
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            await fetchProduct()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleAddModule() {
        if (!newModuleTitle || !produto?.cursos) return

        try {
            const res = await fetch('/api/courses/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId: produto.cursos.id,
                    titulo: newModuleTitle
                })
            })

            if (res.ok) {
                setNewModuleTitle('')
                await fetchProduct()
            }
        } catch (err) {
            console.error(err)
        }
    }

    async function handleAddLesson() {
        if (!newLessonTitle || !newLessonModuleId) return

        try {
            const res = await fetch('/api/courses/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduloId: newLessonModuleId,
                    titulo: newLessonTitle,
                    url_video: newLessonUrl || null
                })
            })

            if (res.ok) {
                setNewLessonTitle('')
                setNewLessonUrl('')
                setNewLessonModuleId('')
                await fetchProduct()
            }
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteModule(moduloId: string) {
        try {
            await fetch(`/api/courses/modules?moduloId=${moduloId}`, { method: 'DELETE' })
            await fetchProduct()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteLesson(aulaId: string) {
        try {
            await fetch(`/api/courses/lessons?aulaId=${aulaId}`, { method: 'DELETE' })
            await fetchProduct()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleEditLesson(aula: Aula) {
        try {
            const res = await fetch('/api/courses/lessons', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aulaId: aula.id,
                    titulo: aula.titulo,
                    url_video: aula.url_video,
                    descricao: aula.descricao,
                    release_days: aula.release_days
                })
            })

            if (res.ok) {
                await fetchProduct()
            } else {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao atualizar aula')
            }
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    async function handleEditModuleUpdate(modulo: Modulo) {
        try {
            const res = await fetch('/api/courses/modules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduloId: modulo.id,
                    titulo: modulo.titulo,
                    release_days: modulo.release_days
                })
            })

            if (res.ok) {
                await fetchProduct()
            } else {
                throw new Error('Erro ao atualizar módulo')
            }
        } catch (err) {
            console.error(err)
        }
    }

    function openEditLesson(aula: Aula) {
        setEditingLesson(aula)
        setIsEditLessonOpen(true)
    }

    async function handleDeleteProduct() {
        try {
            await fetch(`/api/products/${productId}`, { method: 'DELETE' })
            router.push('/dashboard/products')
        } catch (err) {
            console.error(err)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error && !produto) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-500">{error}</p>
                <Button asChild>
                    <Link href="/dashboard/products">Voltar</Link>
                </Button>
            </div>
        )
    }

    const checkoutUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/checkout/${produto?.checkout_hash}`
        : `/checkout/${produto?.checkout_hash}`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/products">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{nome}</h1>
                        <p className="text-muted-foreground">Editar produto</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/checkout/${produto?.checkout_hash}`} target="_blank">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Checkout
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(checkoutUrl)}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Link
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    {tipoEntrega === 'area_membros' && (
                        <TabsTrigger value="course">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Curso
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="checkout">Checkout</TabsTrigger>
                    <TabsTrigger value="bumps">
                        <Tag className="w-4 h-4 mr-2" />
                        Order Bumps
                    </TabsTrigger>
                    <TabsTrigger value="danger">Zona de Perigo</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações Básicas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {error && (
                                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="nome">Nome</Label>
                                        <Input
                                            id="nome"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="descricao">Descrição</Label>
                                        <Textarea
                                            id="descricao"
                                            value={descricao}
                                            onChange={(e) => setDescricao(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Preço</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Preço de Venda (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={preco}
                                                onChange={(e) => setPreco(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Preço Anterior (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={precoAnterior}
                                                onChange={(e) => setPrecoAnterior(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Imagem do Produto</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ImageUpload
                                        value={foto}
                                        onChange={setFoto}
                                        type="product"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Gateway</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={gateway} onValueChange={setGateway}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                                            <SelectItem value="pushinpay">PushinPay</SelectItem>
                                            <SelectItem value="efi">Efí</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <Button
                                        className="w-full"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Salvar Alterações
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Course Tab */}
                {tipoEntrega === 'area_membros' && (
                    <TabsContent value="course">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gerenciar Curso</CardTitle>
                                <CardDescription>
                                    Organize os módulos e aulas do seu curso
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Module */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nome do novo módulo"
                                        value={newModuleTitle}
                                        onChange={(e) => setNewModuleTitle(e.target.value)}
                                    />
                                    <Button onClick={handleAddModule}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Módulo
                                    </Button>
                                </div>

                                <Separator />

                                {/* Modules List */}
                                {produto?.cursos?.modulos && produto.cursos.modulos.length > 0 ? (
                                    <Accordion type="multiple" className="space-y-2">
                                        {produto.cursos.modulos.map((modulo) => (
                                            <AccordionItem
                                                key={modulo.id}
                                                value={modulo.id}
                                                className="border rounded-lg px-4"
                                            >
                                                <AccordionTrigger className="hover:no-underline pr-2">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium flex-1 text-left">{modulo.titulo}</span>
                                                        <span className="text-xs text-muted-foreground mr-2">
                                                            ({modulo.aulas.length} aulas)
                                                        </span>
                                                        <div
                                                            className="flex gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary z-10"
                                                                onClick={() => {
                                                                    setEditingModule(modulo)
                                                                    setIsEditModuleOpen(true)
                                                                }}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-4">
                                                    <div className="space-y-3 pl-7">
                                                        {/* Lessons */}
                                                        {modulo.aulas.map((aula) => (
                                                            <div
                                                                key={aula.id}
                                                                className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <span className="text-sm font-medium block">{aula.titulo}</span>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            {aula.url_video && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Video className="w-3 h-3" />
                                                                                    Com vídeo
                                                                                </span>
                                                                            )}
                                                                            {aula.release_days > 0 && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3" />
                                                                                    {aula.release_days}d
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                        onClick={() => openEditLesson(aula)}
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                        onClick={() => handleDeleteLesson(aula.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Add Lesson Form */}
                                                        <div className="flex gap-2 pt-2">
                                                            <Input
                                                                placeholder="Título da aula"
                                                                value={newLessonModuleId === modulo.id ? newLessonTitle : ''}
                                                                onChange={(e) => {
                                                                    setNewLessonModuleId(modulo.id)
                                                                    setNewLessonTitle(e.target.value)
                                                                }}
                                                                onFocus={() => setNewLessonModuleId(modulo.id)}
                                                            />
                                                            <Input
                                                                placeholder="URL do vídeo (opcional)"
                                                                value={newLessonModuleId === modulo.id ? newLessonUrl : ''}
                                                                onChange={(e) => setNewLessonUrl(e.target.value)}
                                                                className="hidden sm:block"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={handleAddLesson}
                                                                disabled={newLessonModuleId !== modulo.id || !newLessonTitle}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <Separator />

                                                        {/* Delete Module */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => handleDeleteModule(modulo.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir Módulo
                                                        </Button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum módulo criado ainda. Adicione seu primeiro módulo acima.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Checkout Tab */}
                <TabsContent value="checkout">
                    <CheckoutEditor value={checkoutConfig} onChange={setCheckoutConfig} />
                </TabsContent>

                {/* Order Bumps Tab */}
                <TabsContent value="bumps">
                    <OrderBumpManager productId={productId} />
                </TabsContent>

                {/* Danger Zone */}
                <TabsContent value="danger">
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                            <CardDescription>
                                Ações irreversíveis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir Produto
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O produto, curso, módulos,
                                            aulas e todas as vendas associadas serão excluídos permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteProduct}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Sim, excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Lesson Dialog */}
            <EditLessonDialog
                aula={editingLesson}
                open={isEditLessonOpen}
                onOpenChange={setIsEditLessonOpen}
                onSave={handleEditLesson}
            />

            <EditModuleDialog
                modulo={editingModule}
                open={isEditModuleOpen}
                onOpenChange={setIsEditModuleOpen}
                onSave={handleEditModuleUpdate}
            />
        </div>
    )
}
