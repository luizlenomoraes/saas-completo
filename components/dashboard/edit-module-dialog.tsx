'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Package, Clock } from 'lucide-react'

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
    aulas?: Aula[]
}

interface EditModuleDialogProps {
    modulo: Modulo | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (modulo: Modulo) => Promise<void>
}

export function EditModuleDialog({ modulo, open, onOpenChange, onSave }: EditModuleDialogProps) {
    const [titulo, setTitulo] = useState('')
    const [releaseDays, setReleaseDays] = useState('0')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (modulo && open) {
            setTitulo(modulo.titulo)
            setReleaseDays(modulo.release_days?.toString() || '0')
        }
    }, [modulo, open])

    const handleSave = async () => {
        if (!modulo || !titulo) return

        setIsSaving(true)
        try {
            await onSave({
                ...modulo,
                titulo,
                release_days: parseInt(releaseDays) || 0
            })
            onOpenChange(false)
        } catch (err) {
            console.error('Erro ao salvar módulo:', err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Editar Módulo
                    </DialogTitle>
                    <DialogDescription>
                        Modifique as informações do módulo
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título do Módulo *</Label>
                        <Input
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
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
                            Liberação automática após dias da compra.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !titulo} className="bg-[#D4AF37] hover:bg-[#B5952F] text-black">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
