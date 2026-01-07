'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [isValidToken, setIsValidToken] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { token: token || '', password: '', confirmPassword: '' },
    })

    useEffect(() => {
        if (!token) {
            setIsValidating(false)
            return
        }
        setValue('token', token)

        const validateToken = async () => {
            try {
                const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
                const result = await response.json()
                setIsValidToken(result.valid)
            } catch {
                setIsValidToken(false)
            } finally {
                setIsValidating(false)
            }
        }
        validateToken()
    }, [token, setValue])

    const onSubmit = async (data: ResetPasswordInput) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!response.ok) throw new Error()
            setIsSuccess(true)
            toast.success('Senha atualizada com sucesso')
        } catch {
            toast.error('Erro ao atualizar senha')
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidating) {
        return (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                <p className="text-zinc-400 text-sm">Validando credenciais...</p>
            </div>
        )
    }

    if (!isValidToken) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-red-900/30 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-serif text-white">Link Expirado</h2>
                    <p className="text-zinc-400 text-sm">Este link de recuperação não é mais válido.</p>
                </div>
                <Link href="/forgot-password" className="block">
                    <Button className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12">
                        Solicitar novo link
                    </Button>
                </Link>
                <Link href="/login" className="block text-sm text-zinc-500 hover:text-white transition-colors">
                    Voltar para Login
                </Link>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-[#D4AF37]/10 rounded-full flex items-center justify-center animate-scale-in">
                    <CheckCircle2 className="h-8 w-8 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-serif text-white">Senha Atualizada</h2>
                    <p className="text-zinc-400 font-light">
                        Sua segurança foi restaurada. Você já pode acessar sua conta.
                    </p>
                </div>
                <Link href="/login" className="block">
                    <Button className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12">
                        Acessar Plataforma
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="glass-panel p-8 rounded-2xl border border-white/5">
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-serif text-white">Nova Senha</h1>
                    <p className="text-zinc-400 text-sm font-light">Defina sua nova credencial de acesso</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Nova senha</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                className="pl-10 pr-10 bg-black/20 border-white/10 text-white focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 transition-all h-11"
                                placeholder="Mínimo 6 caracteres"
                                disabled={isLoading}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Confirmar senha</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" />
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="pl-10 pr-10 bg-black/20 border-white/10 text-white focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 transition-all h-11"
                                placeholder="Repita a senha"
                                disabled={isLoading}
                                {...register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12 mt-4 transition-all hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Redefinir Senha'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
