'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Key } from "lucide-react"

export function PwaConfigForm() {
    const [config, setConfig] = useState({
        app_name: 'AgentiVerso SaaS',
        short_name: 'AgentiVerso',
        theme_color: '#D4AF37',
        background_color: '#000000',
        vapid_public_key: '',
        vapid_private_key: ''
    })
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetch('/api/admin/pwa/config')
            .then(r => r.json())
            .then(data => {
                // Se existe config, usa. Se não, usa defaults do state.
                if (data && Object.keys(data).length > 0) {
                    setConfig(prev => ({ ...prev, ...data }))
                }
            })
            .catch(console.error)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/pwa/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            if (!res.ok) throw new Error()
            toast.success('Configuração Salva!')
        } catch {
            toast.error('Erro ao salvar configuração')
        } finally {
            setLoading(false)
        }
    }

    const generateKeys = async () => {
        setGenerating(true)
        try {
            const res = await fetch('/api/admin/pwa/generate-keys', { method: 'POST' })
            const keys = await res.json()
            setConfig(prev => ({
                ...prev,
                vapid_public_key: keys.publicKey,
                vapid_private_key: keys.privateKey
            }))
            toast.success('Chaves geradas! Clique em Salvar.')
        } catch {
            toast.error('Erro ao gerar chaves')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="app_name" className="text-white">Nome do App</Label>
                    <Input id="app_name" value={config.app_name} onChange={e => setConfig({ ...config, app_name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="short_name" className="text-white">Nome Curto</Label>
                    <Input id="short_name" value={config.short_name} onChange={e => setConfig({ ...config, short_name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="theme_color" className="text-white">Cor Tema</Label>
                    <div className="flex gap-2">
                        <Input type="color" id="theme_color" value={config.theme_color} onChange={e => setConfig({ ...config, theme_color: e.target.value })} className="w-12 h-10 p-1 bg-zinc-800 border-zinc-700" />
                        <Input value={config.theme_color} onChange={e => setConfig({ ...config, theme_color: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white font-mono" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="background_color" className="text-white">Cor Fundo</Label>
                    <div className="flex gap-2">
                        <Input type="color" id="background_color" value={config.background_color} onChange={e => setConfig({ ...config, background_color: e.target.value })} className="w-12 h-10 p-1 bg-zinc-800 border-zinc-700" />
                        <Input value={config.background_color} onChange={e => setConfig({ ...config, background_color: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white font-mono" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Push Notifications (VAPID)</h3>
                    <Button type="button" variant="outline" size="sm" onClick={generateKeys} disabled={generating}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                        Gerar Chaves
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="public_key" className="text-white">Public Key</Label>
                    <Input id="public_key" value={config.vapid_public_key || ''} onChange={e => setConfig({ ...config, vapid_public_key: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="private_key" className="text-white">Private Key</Label>
                    <Input id="private_key" type="password" value={config.vapid_private_key || ''} onChange={e => setConfig({ ...config, vapid_private_key: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Configuração PWA
            </Button>
        </form>
    )
}
