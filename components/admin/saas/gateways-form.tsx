'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function GatewaysForm({ initialData }: { initialData?: any }) {
    const [loading, setLoading] = useState(false)
    const [mpToken, setMpToken] = useState(initialData?.mp_access_token || '')

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/saas/gateways', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gateway: 'mercadopago', mp_access_token: mpToken })
            })
            if (!res.ok) throw new Error('Falha ao salvar')
            toast.success('Configurações salvas!')
        } catch (e) {
            toast.error('Erro ao salvar gateway')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Mercado Pago (Admin)</CardTitle>
                <CardDescription>Configure as credenciais para receber pagamentos das assinaturas SaaS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Access Token (Produção)</Label>
                    <Input
                        type="password"
                        value={mpToken}
                        onChange={e => setMpToken(e.target.value)}
                        placeholder="APP_USR-..."
                    />
                    <p className="text-xs text-muted-foreground">Este token será usado para processar os pagamentos dos planos na sua conta Mercado Pago.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Credenciais
                </Button>
            </CardContent>
        </Card>
    )
}
