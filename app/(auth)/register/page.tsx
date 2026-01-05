'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, User, Mail, Lock, Eye, EyeOff, Phone, CheckCircle2 } from 'lucide-react'

import { registerSchema, type RegisterInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Formata telefone para (DD) 9XXXX-XXXX
 */
function formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '')

    if (digits.length <= 2) {
        return digits.length > 0 ? `(${digits}` : ''
    }
    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    if (digits.length <= 11) {
        const hasNine = digits.length === 11
        if (hasNine) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        }
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [phoneValue, setPhoneValue] = useState('')

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    })

    // Observar mudanças na senha para validação visual
    const password = watch('password')
    const passwordRequirements = {
        minLength: password?.length >= 6,
    }

    // Handler para formatar telefone
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneInput(e.target.value)
        setPhoneValue(formatted)
        // Enviar apenas dígitos para o form
        setValue('phone', e.target.value.replace(/\D/g, ''), { shouldValidate: true })
    }

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                toast.error('Erro ao criar conta', {
                    description: result.error || 'Tente novamente mais tarde.',
                })
                return
            }

            // Se conta foi atualizada (era membro, virou infoprodutor)
            if (result.upgraded) {
                toast.success('Conta atualizada!', {
                    description: 'Sua conta foi convertida para infoprodutor.',
                })
            } else {
                toast.success('Conta criada com sucesso!', {
                    description: 'Fazendo login automaticamente...',
                })
            }

            // Login automático
            const signInResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (signInResult?.ok) {
                router.push('/dashboard')
                router.refresh()
            } else {
                // Se login automático falhar, redirecionar para login
                router.push('/login')
            }
        } catch (error) {
            toast.error('Erro ao criar conta', {
                description: 'Ocorreu um erro inesperado. Tente novamente.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center">
                {/* Logo mobile */}
                <div className="lg:hidden mb-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                </div>

                <CardTitle className="text-2xl font-bold">Criar sua conta</CardTitle>
                <CardDescription>
                    Comece a vender seus produtos digitais hoje mesmo
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome completo"
                                className="pl-10"
                                disabled={isLoading}
                                {...register('name')}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-10"
                                disabled={isLoading}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Telefone com DDD */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Telefone com DDD <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(11) 99999-9999"
                                className="pl-10"
                                disabled={isLoading}
                                value={phoneValue}
                                onChange={handlePhoneChange}
                                maxLength={16}
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-sm text-red-500">{errors.phone.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            Formato: (DDD) + número. Ex: (11) 99999-9999
                        </p>
                    </div>

                    {/* Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mínimo 6 caracteres"
                                className="pl-10 pr-10"
                                disabled={isLoading}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}

                        {/* Indicador de força da senha */}
                        <div className="flex items-center gap-2 text-xs">
                            <CheckCircle2
                                className={`h-3.5 w-3.5 ${passwordRequirements.minLength
                                        ? 'text-green-500'
                                        : 'text-gray-300'
                                    }`}
                            />
                            <span className={passwordRequirements.minLength ? 'text-green-600' : 'text-gray-400'}>
                                Mínimo 6 caracteres
                            </span>
                        </div>
                    </div>

                    {/* Confirmar Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Repita sua senha"
                                className="pl-10 pr-10"
                                disabled={isLoading}
                                {...register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Termos */}
                    <p className="text-xs text-gray-500 text-center">
                        Ao criar sua conta, você concorda com nossos{' '}
                        <Link href="/termos" className="text-green-600 hover:underline">
                            Termos de Uso
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacidade" className="text-green-600 hover:underline">
                            Política de Privacidade
                        </Link>
                        .
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-5"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando conta...
                            </>
                        ) : (
                            'Criar minha conta'
                        )}
                    </Button>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Já tem uma conta?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 hover:underline"
                        >
                            Fazer login
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
