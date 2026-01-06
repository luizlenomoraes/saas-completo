'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export function TrackingSettings() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        facebook_pixel_id: '',
        google_analytics_id: '',
        tiktok_pixel_id: '',
        kwai_pixel_id: '',
        pinterest_pixel_id: '',
        taboola_pixel_id: '',
        linkedin_pixel_id: ''
    })

    useEffect(() => {
        setLoading(true)
        fetch('/api/admin/tracking')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setFormData({
                        facebook_pixel_id: data.facebook_pixel_id || '',
                        google_analytics_id: data.google_analytics_id || '',
                        tiktok_pixel_id: data.tiktok_pixel_id || '',
                        kwai_pixel_id: data.kwai_pixel_id || '',
                        pinterest_pixel_id: data.pinterest_pixel_id || '',
                        taboola_pixel_id: data.taboola_pixel_id || '',
                        linkedin_pixel_id: data.linkedin_pixel_id || ''
                    })
                }
            })
            .catch(error => {
                console.error('Erro ao carregar configurações:', error)
                toast.error('Erro ao carregar configurações')
            })
            .finally(() => setLoading(false))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch('/api/admin/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Falha ao salvar')

            toast.success('Configurações de rastreamento salvas com sucesso!')
            router.refresh()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            toast.error('Erro ao salvar as configurações')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pixels de Rastreamento</CardTitle>
                        <CardDescription>
                            Insira os IDs dos pixels das plataformas de anúncio. Os scripts serão injetados automaticamente em todas as páginas públicas (Checkout, etc).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                                <Input
                                    id="facebook_pixel_id"
                                    name="facebook_pixel_id"
                                    placeholder="Ex: 1234567890"
                                    value={formData.facebook_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="google_analytics_id">Google Analytics ID (G-XXXXX)</Label>
                                <Input
                                    id="google_analytics_id"
                                    name="google_analytics_id"
                                    placeholder="Ex: G-XXXXXXXXXX"
                                    value={formData.google_analytics_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tiktok_pixel_id">TikTok Pixel ID</Label>
                                <Input
                                    id="tiktok_pixel_id"
                                    name="tiktok_pixel_id"
                                    placeholder="Ex: CXXXXXXXXXXXXXX"
                                    value={formData.tiktok_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="kwai_pixel_id">Kwai Pixel ID</Label>
                                <Input
                                    id="kwai_pixel_id"
                                    name="kwai_pixel_id"
                                    placeholder="Ex: 123456789"
                                    value={formData.kwai_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pinterest_pixel_id">Pinterest Tag ID</Label>
                                <Input
                                    id="pinterest_pixel_id"
                                    name="pinterest_pixel_id"
                                    placeholder="Ex: 261234567890"
                                    value={formData.pinterest_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taboola_pixel_id">Taboola Pixel ID</Label>
                                <Input
                                    id="taboola_pixel_id"
                                    name="taboola_pixel_id"
                                    placeholder="Ex: 1234567"
                                    value={formData.taboola_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin_pixel_id">LinkedIn Insight Tag ID</Label>
                                <Input
                                    id="linkedin_pixel_id"
                                    name="linkedin_pixel_id"
                                    placeholder="Ex: 1234567"
                                    value={formData.linkedin_pixel_id}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Configurações
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
