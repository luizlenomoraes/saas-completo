'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2, Globe, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Webhook {
    id: string
    url: string
    produto_id: string | null
    produtos?: { nome: string }
    event_approved: boolean
    event_pending: boolean
    event_rejected: boolean
    event_refunded: boolean
    event_charged_back: boolean
    created_at: string
}

interface Product {
    id: string
    nome: string
}

export function WebhooksManager() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form
    const [url, setUrl] = useState('')
    const [selectedProduct, setSelectedProduct] = useState('global')
    const [events, setEvents] = useState<string[]>(['approved'])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [webhooksRes, productsRes] = await Promise.all([
                fetch('/api/integrations/webhooks'),
                fetch('/api/products')
            ])

            if (webhooksRes.ok) setWebhooks(await webhooksRes.json())
            if (productsRes.ok) {
                const pData = await productsRes.json()
                setProducts(pData.produtos || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!url) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/integrations/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    produto_id: selectedProduct === 'global' ? null : selectedProduct,
                    events
                })
            })

            if (!res.ok) throw new Error('Erro ao criar webhook')

            toast.success('Webhook criado!')
            setIsDialogOpen(false)
            setUrl('')
            setSelectedProduct('global')
            setEvents(['approved'])
            fetchData() // Reload
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return

        try {
            await fetch(`/api/integrations/webhooks/${id}`, { method: 'DELETE' })
            setWebhooks(webhooks.filter(w => w.id !== id))
            toast.success('Webhook removido')
        } catch {
            toast.error('Erro ao remover')
        }
    }

    const toggleEvent = (event: string) => {
        setEvents(prev =>
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        )
    }

    const getActiveEvents = (w: Webhook) => {
        const events = []
        if (w.event_approved) events.push('Aprovada')
        if (w.event_pending) events.push('Pendente')
        if (w.event_rejected) events.push('Recusada')
        if (w.event_refunded) events.push('Reembolso')
        if (w.event_charged_back) events.push('Chargeback')
        return events
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Webhooks</h3>
                    <p className="text-sm text-muted-foreground">Envie notificações de vendas para sistemas externos</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Webhook
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : webhooks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <Globe className="w-10 h-10 mb-4 opacity-50" />
                        <p>Nenhum webhook configurado</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Escopo</TableHead>
                                <TableHead>Eventos</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.map((webhook) => (
                                <TableRow key={webhook.id}>
                                    <TableCell className="font-mono text-xs truncate max-w-[300px]" title={webhook.url}>
                                        {webhook.url}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {webhook.produto_id ? webhook.produtos?.nome || 'Produto Específico' : 'Global (Todos)'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {getActiveEvents(webhook).map(e => (
                                                <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(webhook.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Webhook</DialogTitle>
                        <DialogDescription>
                            Configure para onde enviar os dados da venda.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>URL de Destino (POST)</Label>
                            <Input
                                placeholder="https://api.seusistema.com/webhook"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Escopo</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Todos os produtos (Global)</SelectItem>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Eventos</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-approved" checked={events.includes('approved')} onCheckedChange={() => toggleEvent('approved')} />
                                    <Label htmlFor="evt-approved">Venda Aprovada</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-pending" checked={events.includes('pending')} onCheckedChange={() => toggleEvent('pending')} />
                                    <Label htmlFor="evt-pending">Venda Pendente (Pix/Boleto)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-rejected" checked={events.includes('rejected')} onCheckedChange={() => toggleEvent('rejected')} />
                                    <Label htmlFor="evt-rejected">Venda Recusada</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-refunded" checked={events.includes('refunded')} onCheckedChange={() => toggleEvent('refunded')} />
                                    <Label htmlFor="evt-refunded">Reembolso</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-charged_back" checked={events.includes('charged_back')} onCheckedChange={() => toggleEvent('charged_back')} />
                                    <Label htmlFor="evt-charged_back">Chargeback</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={!url || isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Webhook'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
