'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Globe, Mail, Shield, AlertTriangle, Palette, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SettingsFormProps {
    initialSettings: Record<string, string | null>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [settings, setSettings] = useState(initialSettings)

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSwitchChange = (key: string, checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked ? 'true' : 'false' }))
    }

    const saveSettings = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (!res.ok) throw new Error('Falha ao salvar')

            toast.success('Configurações atualizadas', {
                description: 'Todas as alterações foram salvas com sucesso.'
            })
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar', {
                description: 'Verifique os dados e tente novamente.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-black/20 border border-white/10 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <Globe className="w-4 h-4 mr-2" /> Geral
                    </TabsTrigger>
                    <TabsTrigger value="visual" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <Palette className="w-4 h-4 mr-2" /> Visual
                    </TabsTrigger>
                    <TabsTrigger value="email" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <Mail className="w-4 h-4 mr-2" /> Email (SMTP)
                    </TabsTrigger>
                    <TabsTrigger value="banner" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Banner
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* ABA GERAL */}
                    <TabsContent value="general">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Informações Gerais</CardTitle>
                                <CardDescription>Detalhes básicos da plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Nome do Sistema</Label>
                                    <Input
                                        value={settings.system_name || ''}
                                        onChange={e => handleChange('system_name', e.target.value)}
                                        placeholder="Ex: AgentiVerso"
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>URL do Sistema</Label>
                                    <Input
                                        value={settings.system_url || ''}
                                        onChange={e => handleChange('system_url', e.target.value)}
                                        placeholder="https://seu-dominio.com"
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sufixo SEO (Title)</Label>
                                    <Input
                                        value={settings.seo_title_suffix || ''}
                                        onChange={e => handleChange('seo_title_suffix', e.target.value)}
                                        placeholder=" | AgentiVerso"
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA VISUAL */}
                    <TabsContent value="visual">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Identidade Visual</CardTitle>
                                <CardDescription>Personalize a aparência do sistema.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Logo URL</Label>
                                    <Input
                                        value={settings.system_logo || ''}
                                        onChange={e => handleChange('system_logo', e.target.value)}
                                        placeholder="/logo.png ou https://..."
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cor Primária (Hex)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={settings.ui_primary_color || '#D4AF37'}
                                            onChange={e => handleChange('ui_primary_color', e.target.value)}
                                            placeholder="#D4AF37"
                                            className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                        />
                                        <div
                                            className="w-10 h-10 rounded border border-white/20"
                                            style={{ backgroundColor: settings.ui_primary_color || '#D4AF37' }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Nota: O tema atual força paleta Dourada/Preta, mas isso pode ser usado em elementos dinâmicos.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA EMAIL */}
                    <TabsContent value="email">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Configuração SMTP</CardTitle>
                                <CardDescription>Usado para envio de emails transacionais.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Host SMTP</Label>
                                        <Input
                                            value={settings.smtp_host || ''}
                                            onChange={e => handleChange('smtp_host', e.target.value)}
                                            placeholder="smtp.resend.com"
                                            className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Porta</Label>
                                        <Input
                                            value={settings.smtp_port || ''}
                                            onChange={e => handleChange('smtp_port', e.target.value)}
                                            placeholder="465"
                                            className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Usuário</Label>
                                    <Input
                                        value={settings.smtp_user || ''}
                                        onChange={e => handleChange('smtp_user', e.target.value)}
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Senha</Label>
                                    <Input
                                        type="password"
                                        value={settings.smtp_pass || ''}
                                        onChange={e => handleChange('smtp_pass', e.target.value)}
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Remetente Padrão (From)</Label>
                                    <Input
                                        value={settings.smtp_from || ''}
                                        onChange={e => handleChange('smtp_from', e.target.value)}
                                        placeholder="nao-responda@agentiverso.Qw"
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA BANNER */}
                    <TabsContent value="banner">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Banner de Aviso</CardTitle>
                                <CardDescription>Exibe um aviso no topo de todas as páginas.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-black/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ativar Banner</Label>
                                        <p className="text-sm text-muted-foreground">O banner será visível para todos os usuários.</p>
                                    </div>
                                    <Switch
                                        checked={settings.banner_active === 'true'}
                                        onCheckedChange={(c) => handleSwitchChange('banner_active', c)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Texto do Banner</Label>
                                    <Input
                                        value={settings.banner_text || ''}
                                        onChange={e => handleChange('banner_text', e.target.value)}
                                        placeholder="Ex: Manutenção programada para..."
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Cor de Fundo (Classe Tailwind ou Hex)</Label>
                                    <Input
                                        value={settings.banner_color || 'bg-yellow-600'}
                                        onChange={e => handleChange('banner_color', e.target.value)}
                                        placeholder="Ex: bg-red-600 ou #FF0000"
                                        className="bg-black/20 border-white/10 focus:border-[#D4AF37]"
                                    />
                                    <p className="text-xs text-muted-foreground">Recomendado usar classes do Tailwind como `bg-primary`, `bg-red-600`.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold min-w-[150px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
