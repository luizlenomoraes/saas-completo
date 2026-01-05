'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2, LineChart } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface UtmfyIntegration {
    id: string
    name: string
    api_token: string
    produto_id: string | null
    produtos?: { nome: string }
    event_approved: boolean
    event_pending: boolean
    event_rejected: boolean
    event_refunded: boolean
    event_charged_back: boolean
    event_initiate_checkout: boolean
    created_at: string
}

interface Product {
    id: string
    nome: string
}

export function UtmfyManager() {
    const [integrations, setIntegrations] = useState<UtmfyIntegration[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form
    const [name, setName] = useState('')
    const [apiToken, setApiToken] = useState('')
    const [selectedProduct, setSelectedProduct] = useState('global')
    const [events, setEvents] = useState<string[]>(['approved', 'initiate_checkout'])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [integrationsRes, productsRes] = await Promise.all([
                fetch('/api/integrations/utmfy'),
                fetch('/api/products')
            ])

            if (integrationsRes.ok) setIntegrations(await integrationsRes.json())
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
        if (!name || !apiToken) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/integrations/utmfy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    api_token: apiToken,
                    product_id: selectedProduct === 'global' ? null : selectedProduct,
                    events
                })
            })

            if (!res.ok) throw new Error('Erro ao criar integração')

            toast.success('Integração UTMify criada!')
            setIsDialogOpen(false)
            setName('')
            setApiToken('')
            setSelectedProduct('global')
            setEvents(['approved', 'initiate_checkout'])
            fetchData()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return

        try {
            await fetch(`/api/integrations/utmfy/${id}`, { method: 'DELETE' })
            setIntegrations(integrations.filter(i => i.id !== id))
            toast.success('Integração removida')
        } catch {
            toast.error('Erro ao remover')
        }
    }

    const toggleEvent = (event: string) => {
        setEvents(prev =>
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Tracking (UTMify)</h3>
                    <p className="text-sm text-muted-foreground">Integração nativa para rastreamento avançado</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Integração
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : integrations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <LineChart className="w-10 h-10 mb-4 opacity-50" />
                        <p>Nenhuma integração UTMify configurada</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Escopo</TableHead>
                                <TableHead>Eventos</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {integrations.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {item.produto_id ? item.produtos?.nome || 'Produto Específico' : 'Global'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {item.event_initiate_checkout && <Badge variant="secondary" className="text-[10px]">IC</Badge>}
                                            {item.event_approved && <Badge variant="secondary" className="text-[10px]">Purchase</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
                        <DialogTitle>Integração UTMify</DialogTitle>
                        <DialogDescription>
                            Conecte com sua conta UTMify para rastreamento preciso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome Identificador</Label>
                            <Input
                                placeholder="Ex: Conta Principal"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>API Token (UTMify)</Label>
                            <Input
                                type="password"
                                placeholder="..."
                                value={apiToken}
                                onChange={e => setApiToken(e.target.value)}
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
                            <Label>Eventos para Enviar</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-ic" checked={events.includes('initiate_checkout')} onCheckedChange={() => toggleEvent('initiate_checkout')} />
                                    <Label htmlFor="evt-ic">Initiate Checkout</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-approved-u" checked={events.includes('approved')} onCheckedChange={() => toggleEvent('approved')} />
                                    <Label htmlFor="evt-approved-u">Purchase (Aprovada)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="evt-pending-u" checked={events.includes('pending')} onCheckedChange={() => toggleEvent('pending')} />
                                    <Label htmlFor="evt-pending-u">Pendente (Pix Gerado)</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={!name || !apiToken || isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
