'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'

export interface CheckoutConfig {
    primaryColor: string
    backgroundColor: string
    textColor: string
    logoUrl?: string
    timerEnabled: boolean
    timerDuration: number // minutos
    askPhone: boolean
    askCpf: boolean
    socialProofEnabled: boolean
}

export const defaultCheckoutConfig: CheckoutConfig = {
    primaryColor: '#22c55e', // green-500
    backgroundColor: '#ffffff',
    textColor: '#09090b',
    timerEnabled: false,
    timerDuration: 15,
    askPhone: true,
    askCpf: true,
    socialProofEnabled: false
}

interface CheckoutEditorProps {
    value: CheckoutConfig | null
    onChange: (config: CheckoutConfig) => void
}

export function CheckoutEditor({ value, onChange }: CheckoutEditorProps) {
    const config = value || defaultCheckoutConfig

    const handleChange = (key: keyof CheckoutConfig, val: any) => {
        onChange({
            ...config,
            [key]: val
        })
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade Visual</CardTitle>
                        <CardDescription>Personalize as cores e logo do checkout</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Logo do Checkout</Label>
                            <ImageUpload
                                value={config.logoUrl || null}
                                onChange={(url) => handleChange('logoUrl', url)}
                                type="product" // Reuso do tipo product para upload
                            />
                            <p className="text-xs text-muted-foreground">Se não informado, será usado o nome do produto.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cor Primária (Botões)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.primaryColor}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={config.primaryColor}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Cor de Fundo</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.backgroundColor}
                                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={config.backgroundColor}
                                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Funcionalidades e Conversão</CardTitle>
                        <CardDescription>Ative recursos para aumentar a conversão</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Timer de Escassez</Label>
                                <p className="text-sm text-muted-foreground">Mostra um contador regressivo no topo</p>
                            </div>
                            <Switch
                                checked={config.timerEnabled}
                                onCheckedChange={(c) => handleChange('timerEnabled', c)}
                            />
                        </div>

                        {config.timerEnabled && (
                            <div className="space-y-2 pl-4 border-l-2 border-muted animate-in fade-in">
                                <Label>Duração (minutos)</Label>
                                <Input
                                    type="number"
                                    value={config.timerDuration}
                                    onChange={(e) => handleChange('timerDuration', parseInt(e.target.value))}
                                    min={1}
                                    max={1440}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Prova Social</Label>
                                <p className="text-sm text-muted-foreground">Mostra notificações de compras recentes (fictícias)</p>
                            </div>
                            <Switch
                                checked={config.socialProofEnabled}
                                onCheckedChange={(c) => handleChange('socialProofEnabled', c)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Campos do Formulário</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Solicitar Telefone</Label>
                            </div>
                            <Switch
                                checked={config.askPhone}
                                onCheckedChange={(c) => handleChange('askPhone', c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Solicitar CPF</Label>
                            </div>
                            <Switch
                                checked={config.askCpf}
                                onCheckedChange={(c) => handleChange('askCpf', c)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
