'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Tag, AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface Bump {
    id: string
    headline: string
    description: string | null
    is_active: boolean
    offer_product: {
        id: string
        nome: string
        preco: number
        foto: string | null
    }
}

interface Product {
    id: string
    nome: string
    preco: number
}

export function OrderBumpManager({ productId }: { productId: string }) {
    const [bumps, setBumps] = useState<Bump[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [selectedProduct, setSelectedProduct] = useState('')
    const [headline, setHeadline] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        fetchBumps()
        fetchProducts()
    }, [productId])

    const fetchBumps = async () => {
        try {
            const res = await fetch(`/api/products/${productId}/bumps`)
            if (res.ok) setBumps(await res.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                // Filtrar o próprio produto atual da lista
                setProducts(data.produtos.filter((p: any) => p.id !== productId))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreate = async () => {
        if (!selectedProduct || !headline) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/products/${productId}/bumps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offerProductId: selectedProduct,
                    headline,
                    description
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erro ao criar bump')

            toast.success('Order Bump criado!')
            setIsDialogOpen(false)
            setHeadline('')
            setDescription('')
            setSelectedProduct('')
            fetchBumps()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (bumpId: string) => {
        if (!confirm('Tem certeza?')) return

        try {
            await fetch(`/api/products/${productId}/bumps/${bumpId}`, { method: 'DELETE' })
            setBumps(bumps.filter(b => b.id !== bumpId))
            toast.success('Bump removido')
        } catch {
            toast.error('Erro ao remover')
        }
    }

    const handleToggleActive = async (bump: Bump) => {
        const newState = !bump.is_active
        // Otimistic update
        setBumps(bumps.map(b => b.id === bump.id ? { ...b, is_active: newState } : b))

        try {
            await fetch(`/api/products/${productId}/bumps/${bump.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newState })
            })
        } catch {
            // Revert
            setBumps(bumps.map(b => b.id === bump.id ? { ...b, is_active: !newState } : b))
            toast.error('Erro ao atualizar')
        }
    }

    const availableProducts = products.filter(p => !bumps.some(b => b.offer_product.id === p.id))

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Order Bumps</h3>
                    <p className="text-sm text-muted-foreground">Ofereça produtos complementares no checkout</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} disabled={availableProducts.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Bump
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : bumps.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <Tag className="w-10 h-10 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Nenhum Order Bump configurado</p>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            Aumente seu ticket médio oferecendo produtos adicionais na página de pagamento.
                        </p>
                        {availableProducts.length === 0 && products.length > 0 && (
                            <p className="text-xs text-yellow-600 mt-4">Todos os seus outros produtos já foram adicionados.</p>
                        )}
                        {products.length === 0 && (
                            <p className="text-xs text-red-500 mt-4">Você precisa criar outro produto para oferecer como bump.</p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {bumps.map((bump) => (
                        <Card key={bump.id} className="overflow-hidden">
                            <div className="p-4 flex items-center gap-4">
                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {bump.offer_product.foto ? (
                                        <img src={bump.offer_product.foto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Tag className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 md:grid md:grid-cols-3 md:gap-4 items-center">
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold truncate">{bump.headline}</h4>
                                            {!bump.is_active && (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Inativo</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Produto: {bump.offer_product.nome}</p>
                                        <p className="text-sm font-medium">{formatCurrency(bump.offer_product.preco)}</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 mt-2 md:mt-0">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`active-${bump.id}`} className="text-xs">Ativo</Label>
                                            <Switch
                                                id={`active-${bump.id}`}
                                                checked={bump.is_active}
                                                onCheckedChange={() => handleToggleActive(bump)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(bump.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Order Bump</DialogTitle>
                        <DialogDescription>
                            Escolha um produto para oferecer como complemento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Produto Oferta</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProducts.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.nome} - {formatCurrency(p.preco)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Título Chamativo (Headline)</Label>
                            <Input
                                placeholder="Ex: Sim, eu quero levar também..."
                                value={headline}
                                onChange={e => setHeadline(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição Curta</Label>
                            <Textarea
                                placeholder="Explique em poucas palavras o benefício..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={!selectedProduct || !headline || isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Offer Bump'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
