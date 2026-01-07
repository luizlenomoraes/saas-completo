'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    })

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsLoading(true)
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            setIsSuccess(true)
        } catch (error) {
            setIsSuccess(true) // Security first
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#F6D764]" />

                <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto bg-[#D4AF37]/10 rounded-full flex items-center justify-center animate-scale-in">
                        <CheckCircle2 className="h-8 w-8 text-[#D4AF37]" strokeWidth={1.5} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif text-white">Email enviado</h2>
                        <p className="text-zinc-400 font-light">
                            Se existe uma conta para <strong>{getValues('email')}</strong>, enviamos um link de recuperação.
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 text-left border border-white/5">
                        <p className="text-sm text-[#D4AF37] font-medium mb-2">Não recebeu?</p>
                        <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                            <li>Verifique a caixa de Spam</li>
                            <li>Confirme se digitou corretamente</li>
                        </ul>
                    </div>

                    <div className="space-y-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsSuccess(false)}
                            className="w-full border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white hover:border-zinc-500 h-12"
                        >
                            Tentar outro email
                        </Button>
                        <Link href="/login" className="block w-full">
                            <Button className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12">
                                Voltar para Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-panel p-8 rounded-2xl border border-white/5 relative">
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-serif text-white">Recuperação de Senha</h1>
                    <p className="text-zinc-400 text-sm font-light">
                        Digite seu email para receber o link de acesso
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email profissional</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                className="pl-10 bg-black/20 border-white/10 text-white focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 transition-all h-11"
                                disabled={isLoading}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-red-400">{errors.email.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12 shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            'Enviar Link de Recuperação'
                        )}
                    </Button>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-[#D4AF37] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Login
                    </Link>
                </form>
            </div>
        </div>
    )
}
