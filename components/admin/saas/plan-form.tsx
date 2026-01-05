'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PlanData {
    id?: string
    nome: string
    descricao: string
    preco: number
    periodo: 'mensal' | 'anual'
    max_produtos: number | null
    max_pedidos_mes: number | null
    is_free: boolean
    ativo: boolean
}

interface PlanFormProps {
    initialData?: PlanData
    onSuccess: () => void
    onCancel: () => void
}

export function PlanForm({ initialData, onSuccess, onCancel }: PlanFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<PlanData>(initialData || {
        nome: '',
        descricao: '',
        preco: 0,
        periodo: 'mensal',
        max_produtos: 10,
        max_pedidos_mes: 0, // 0 = ilimitado na UI, mas podemos tratar
        is_free: false,
        ativo: true
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = initialData?.id
                ? `/api/admin/saas/plans/${initialData.id}`
                : '/api/admin/saas/plans'

            const method = initialData?.id ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Falha ao salvar plano')

            toast.success(initialData ? 'Plano atualizado!' : 'Plano criado!')
            onSuccess()
        } catch (error) {
            toast.error('Erro ao salvar plano')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label>Nome do Plano</Label>
                <Input
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Preço (R$)</Label>
                    <Input
                        type="number" step="0.01" min="0"
                        value={formData.preco}
                        onChange={e => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                        disabled={formData.is_free}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Período</Label>
                    <Select
                        value={formData.periodo}
                        onValueChange={(v: any) => setFormData({ ...formData, periodo: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Max. Produtos</Label>
                    <Input
                        type="number" min="0"
                        value={formData.max_produtos || 0}
                        onChange={e => setFormData({ ...formData, max_produtos: parseInt(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground">0 = Ilimitado</p>
                </div>
                <div className="grid gap-2">
                    <Label>Max. Pedidos/mês</Label>
                    <Input
                        type="number" min="0"
                        value={formData.max_pedidos_mes || 0}
                        onChange={e => setFormData({ ...formData, max_pedidos_mes: parseInt(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground">0 = Ilimitado</p>
                </div>
            </div>

            <div className="flex items-center justify-between border p-3 rounded-lg">
                <Label>Plano Gratuito?</Label>
                <Switch
                    checked={formData.is_free}
                    onCheckedChange={c => setFormData({ ...formData, is_free: c, preco: c ? 0 : formData.preco })}
                />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-lg">
                <Label>Ativo?</Label>
                <Switch
                    checked={formData.ativo}
                    onCheckedChange={c => setFormData({ ...formData, ativo: c })}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isLoading} className="bg-[#D4AF37] hover:bg-[#B5952F] text-black">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    )
}
