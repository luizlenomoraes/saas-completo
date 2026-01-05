'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogOverlay,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Video, FileText, Clock, Paperclip, Trash2, UploadCloud, File as FileIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Aula {
    id: string
    titulo: string
    url_video: string | null
    descricao: string | null
    ordem: number
    release_days: number
}

interface EditLessonDialogProps {
    aula: Aula | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (aula: Aula) => Promise<void>
}

export function EditLessonDialog({ aula, open, onOpenChange, onSave }: EditLessonDialogProps) {
    const [titulo, setTitulo] = useState('')
    const [urlVideo, setUrlVideo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [releaseDays, setReleaseDays] = useState('0')
    const [isSaving, setIsSaving] = useState(false)

    // Arquivos
    const [files, setFiles] = useState<any[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (aula && open) {
            setTitulo(aula.titulo)
            setUrlVideo(aula.url_video || '')
            setDescricao(aula.descricao || '')
            setReleaseDays(aula.release_days?.toString() || '0')
            fetchFiles(aula.id)
        }
    }, [aula, open])

    const fetchFiles = async (aulaId: string) => {
        setLoadingFiles(true)
        try {
            const res = await fetch(`/api/courses/files?aulaId=${aulaId}`)
            if (res.ok) {
                const data = await res.json()
                setFiles(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingFiles(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !aula) return

        setUploading(true)
        try {
            // 1. Upload físico
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/courses/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) {
                const err = await uploadRes.json()
                throw new Error(err.error || 'Erro no upload')
            }

            const uploadData = await uploadRes.json()

            // 2. Salvar metadados
            const saveRes = await fetch('/api/courses/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aulaId: aula.id,
                    nomeOriginal: uploadData.originalName,
                    nomeSalvo: uploadData.savedName,
                    caminhoArquivo: uploadData.url,
                    tipoMime: uploadData.mimeType,
                    tamanhoBytes: uploadData.size
                })
            })

            if (!saveRes.ok) throw new Error('Erro ao salvar arquivo no banco')

            toast.success('Arquivo enviado!')
            fetchFiles(aula.id)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setUploading(false)
            // Limpar input
            e.target.value = ''
        }
    }

    const deleteFile = async (fileId: string) => {
        try {
            await fetch(`/api/courses/files?arquivoId=${fileId}`, { method: 'DELETE' })
            setFiles(prev => prev.filter(f => f.id !== fileId))
            toast.success('Arquivo removido')
        } catch {
            toast.error('Erro ao remover arquivo')
        }
    }

    const handleSave = async () => {
        if (!aula || !titulo) return

        setIsSaving(true)
        try {
            await onSave({
                ...aula,
                titulo,
                url_video: urlVideo || null,
                descricao: descricao || null,
                release_days: parseInt(releaseDays) || 0
            })
            onOpenChange(false)
            toast.success('Aula atualizada!')
        } catch (err) {
            console.error('Erro ao salvar aula:', err)
            toast.error('Erro ao salvar aula')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>\n        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card text-foreground rounded-lg shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        Editar Aula
                    </DialogTitle>
                    <DialogDescription>
                        Conteúdo e materiais complementares
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Geral</TabsTrigger>
                        <TabsTrigger value="materials">Materiais ({files.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="titulo">Título da Aula *</Label>
                            <Input
                                id="titulo"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ex: Introdução ao Módulo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="urlVideo" className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                URL do Vídeo
                            </Label>
                            <Input
                                id="urlVideo"
                                type="url"
                                value={urlVideo}
                                onChange={(e) => setUrlVideo(e.target.value)}
                                placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Suporta YouTube, Vimeo, Panda, etc.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descricao" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Descrição
                            </Label>
                            <Textarea
                                id="descricao"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva o conteúdo desta aula..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="releaseDays" className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Dias para liberação (Drip)
                            </Label>
                            <Input
                                id="releaseDays"
                                type="number"
                                min="0"
                                value={releaseDays}
                                onChange={(e) => setReleaseDays(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                0 = Imediato. 7 = Uma semana após a compra.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="materials" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Arquivos Anexados</Label>
                            {loadingFiles ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : files.length > 0 ? (
                                <div className="space-y-2">
                                    {files.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/40">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-primary/10 rounded">
                                                    <FileIcon className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.nome_original}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.tamanho_bytes / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteFile(file.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-md">
                                    Nenhum arquivo anexado.
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <div className="border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-6 transition-colors bg-primary/5">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center cursor-pointer gap-2"
                                >
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    ) : (
                                        <UploadCloud className="w-8 h-8 text-primary" />
                                    )}
                                    <span className="text-sm font-medium text-primary">
                                        {uploading ? 'Enviando...' : 'Clique para fazer upload de materiais'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        PDF, ZIP, DOCX, Imagens (Máx 50MB)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !titulo} className="bg-[#D4AF37] hover:bg-[#B5952F] text-black">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvar Alterações
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
