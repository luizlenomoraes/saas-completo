'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User, CreditCard, Shield, Loader2, Save, CheckCircle, AlertCircle, Activity } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrackingSettings } from '@/components/settings/tracking-settings'

export default function SettingsPage() {
    const { data: session } = useSession()

    // Profile state
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileError, setProfileError] = useState('')

    // Gateway state
    const [mpPublicKey, setMpPublicKey] = useState('')
    const [mpAccessToken, setMpAccessToken] = useState('')
    const [isSavingGateway, setIsSavingGateway] = useState(false)
    const [gatewaySuccess, setGatewaySuccess] = useState(false)
    const [gatewayError, setGatewayError] = useState('')

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSavingPassword, setIsSavingPassword] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch('/api/user/profile')
            const data = await res.json()
            if (res.ok) {
                setNome(data.profile.nome || '')
                setTelefone(data.profile.telefone || '')
            }
        } catch (err) {
            console.error('Erro ao carregar perfil:', err)
        }
    }

    async function handleSaveProfile() {
        setIsSavingProfile(true)
        setProfileError('')
        setProfileSuccess(false)

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, telefone })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (err: any) {
            setProfileError(err.message)
        } finally {
            setIsSavingProfile(false)
        }
    }

    async function handleSaveGateway() {
        setIsSavingGateway(true)
        setGatewayError('')
        setGatewaySuccess(false)

        try {
            const res = await fetch('/api/user/gateways', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gateway: 'mercadopago',
                    credentials: {
                        public_key: mpPublicKey || undefined,
                        access_token: mpAccessToken || undefined
                    }
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            setGatewaySuccess(true)
            setMpPublicKey('')
            setMpAccessToken('')
            setTimeout(() => setGatewaySuccess(false), 3000)
        } catch (err: any) {
            setGatewayError(err.message)
        } finally {
            setIsSavingGateway(false)
        }
    }

    async function handleChangePassword() {
        setIsSavingPassword(true)
        setPasswordError('')
        setPasswordSuccess(false)

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem')
            setIsSavingPassword(false)
            return
        }

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao alterar senha')
            }

            setPasswordSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err: any) {
            setPasswordError(err.message)
        } finally {
            setIsSavingPassword(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie suas preferências e configurações da conta
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="w-4 h-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="gateways" className="gap-2">
                        <CreditCard className="w-4 h-4" />
                        Gateways
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Segurança
                    </TabsTrigger>
                    <TabsTrigger value="tracking" className="gap-2">
                        <Activity className="w-4 h-4" />
                        Rastreamento
                    </TabsTrigger>
                </TabsList>

                {/* Perfil */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Perfil</CardTitle>
                            <CardDescription>
                                Atualize suas informações pessoais
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {profileError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{profileError}</AlertDescription>
                                </Alert>
                            )}
                            {profileSuccess && (
                                <Alert className="border-green-500 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>Perfil atualizado com sucesso!</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={session?.user?.email || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome</Label>
                                    <Input
                                        id="nome"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input
                                        id="telefone"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gateways de Pagamento */}
                <TabsContent value="gateways">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gateways de Pagamento</CardTitle>
                            <CardDescription>
                                Configure suas credenciais dos gateways de pagamento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {gatewayError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{gatewayError}</AlertDescription>
                                </Alert>
                            )}
                            {gatewaySuccess && (
                                <Alert className="border-green-500 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>Credenciais atualizadas!</AlertDescription>
                                </Alert>
                            )}

                            {/* Mercado Pago */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="text-2xl">💳</span> Mercado Pago
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="mp_public_key">Public Key</Label>
                                        <Input
                                            id="mp_public_key"
                                            value={mpPublicKey}
                                            onChange={(e) => setMpPublicKey(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mp_access_token">Access Token</Label>
                                        <Input
                                            id="mp_access_token"
                                            type="password"
                                            value={mpAccessToken}
                                            onChange={(e) => setMpAccessToken(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Deixe em branco para manter as credenciais atuais
                                </p>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                <Button onClick={handleSaveGateway} disabled={isSavingGateway}>
                                    {isSavingGateway ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar Gateways
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Segurança */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alterar Senha</CardTitle>
                            <CardDescription>
                                Atualize sua senha de acesso
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {passwordError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}
                            {passwordSuccess && (
                                <Alert className="border-green-500 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>Senha alterada com sucesso!</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Senha Atual</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova Senha</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleChangePassword}
                                disabled={isSavingPassword || !currentPassword || !newPassword}
                            >
                                {isSavingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Alterando...
                                    </>
                                ) : (
                                    'Alterar Senha'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Rastreamento */}
                <TabsContent value="tracking">
                    <TrackingSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
