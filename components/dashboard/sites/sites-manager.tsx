'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Loader2, Plus, Trash2, ExternalLink, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

interface ClonedSite {
    id: string
    title: string
    original_url: string
    slug: string
    created_at: string
}

export function SitesManager() {
    const [sites, setSites] = useState<ClonedSite[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCloning, setIsCloning] = useState(false)

    // Form
    const [url, setUrl] = useState('')
    const [slug, setSlug] = useState('')
    const [title, setTitle] = useState('')

    useEffect(() => {
        fetchSites()
    }, [])

    const fetchSites = async () => {
        try {
            const res = await fetch('/api/sites/clone')
            if (res.ok) setSites(await res.json())
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClone = async () => {
        if (!url || !slug) return

        setIsCloning(true)
        try {
            const res = await fetch('/api/sites/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, slug, title })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erro ao clonar site')

            toast.success('Site clonado com sucesso!')
            setIsDialogOpen(false)
            setUrl('')
            setSlug('')
            setTitle('')
            fetchSites()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsCloning(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return

        try {
            await fetch(`/api/sites/${id}`, { method: 'DELETE' })
            setSites(sites.filter(s => s.id !== id))
            toast.success('Site removido')
        } catch {
            toast.error('Erro ao remover')
        }
    }

    const copyLink = (slug: string) => {
        const link = `${window.location.origin}/s/${slug}`
        navigator.clipboard.writeText(link)
        toast.success('Link copiado!')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Meus Sites</h3>
                    <p className="text-sm text-muted-foreground">Gerencie suas páginas clonadas e de alta conversão.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Clonar Página
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : sites.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <Globe className="w-10 h-10 mb-4 opacity-50" />
                        <p>Nenhuma página clonada ainda.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Slug / URL Local</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead className="w-[150px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sites.map((site) => (
                                <TableRow key={site.id}>
                                    <TableCell className="font-medium">
                                        {site.title || site.slug}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">/s/{site.slug}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyLink(site.slug)}>
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs" title={site.original_url}>
                                        {site.original_url}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/s/${site.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(site.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
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
                        <DialogTitle>Clonar Página</DialogTitle>
                        <DialogDescription>
                            Copie qualquer página da web para usar em suas campanhas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>URL Original</Label>
                            <Input
                                placeholder="https://exemplo.com/pagina-vendas"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Slug (URL Amigável)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">seudominio.com/s/</span>
                                <Input
                                    placeholder="minha-oferta"
                                    value={slug}
                                    onChange={e => setSlug(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título Interno</Label>
                            <Input
                                placeholder="Página de Vendas Produto X"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleClone} disabled={!url || !slug || isCloning}>
                            {isCloning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Clonando...
                                </>
                            ) : 'Clonar Agora'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
