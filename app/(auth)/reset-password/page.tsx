'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [isValidToken, setIsValidToken] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: token || '',
            password: '',
            confirmPassword: '',
        },
    })

    // Validar token ao carregar
    useEffect(() => {
        if (!token) {
            setIsValidating(false)
            setIsValidToken(false)
            return
        }

        setValue('token', token)

        // Validar token com a API
        const validateToken = async () => {
            try {
                const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
                const result = await response.json()
                setIsValidToken(result.valid)
            } catch (error) {
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

            const result = await response.json()

            if (!response.ok) {
                toast.error('Erro ao redefinir senha', {
                    description: result.error || 'Tente novamente.',
                })
                return
            }

            setIsSuccess(true)
            toast.success('Senha redefinida com sucesso!')
        } catch (error) {
            toast.error('Erro ao redefinir senha', {
                description: 'Ocorreu um erro inesperado. Tente novamente.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Loading de validação
    if (isValidating) {
        return (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        <p className="text-gray-600 dark:text-gray-400">Validando link...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Token inválido ou expirado
    if (!isValidToken) {
        return (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Link inválido ou expirado</CardTitle>
                    <CardDescription className="text-base">
                        Este link de recuperação de senha não é válido ou já expirou.
                    </CardDescription>
                </CardHeader>

                <CardFooter className="flex flex-col gap-4">
                    <Link href="/forgot-password" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                            Solicitar novo link
                        </Button>
                    </Link>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para login
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    // Sucesso
    if (isSuccess) {
        return (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Senha redefinida!</CardTitle>
                    <CardDescription className="text-base">
                        Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
                    </CardDescription>
                </CardHeader>

                <CardFooter>
                    <Link href="/login" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-5">
                            Fazer login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
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

                <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
                <CardDescription>
                    Digite sua nova senha abaixo
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {/* Nova Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova senha</Label>
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
                    </div>

                    {/* Confirmar Nova Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Repita sua nova senha"
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
                                Redefinindo...
                            </>
                        ) : (
                            'Redefinir senha'
                        )}
                    </Button>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}
