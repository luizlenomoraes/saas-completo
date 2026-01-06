'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

function SetupPasswordContent() {
    const searchParams = useSearchParams()
    const _router = useRouter()
    const token = searchParams.get('token')

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const [email, setEmail] = useState('')
    const [produtoNome, setProdutoNome] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [alreadySetup, setAlreadySetup] = useState(false)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        if (!token) {
            setError('Token não fornecido')
            setIsLoading(false)
            return
        }

        // Validar o token
        fetch(`/api/members/setup-password?token=${encodeURIComponent(token)}`)
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    setIsValid(true)
                    setEmail(data.email)
                    setProdutoNome(data.produtoNome)
                } else {
                    setError(data.error || 'Token inválido')
                    if (data.alreadySetup) {
                        setAlreadySetup(true)
                    }
                }
            })
            .catch(() => {
                setError('Erro ao validar token')
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [token])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        if (password !== confirmPassword) {
            setError('As senhas não coincidem')
            setIsSubmitting(false)
            return
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/members/setup-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao configurar senha')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Erro ao configurar senha')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-muted-foreground">Validando seu acesso...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-green-600">Senha Configurada!</CardTitle>
                        <CardDescription>
                            Sua senha foi configurada com sucesso. Agora você pode fazer login.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/login">Ir para o Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!isValid) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-red-600">
                            {alreadySetup ? 'Senha já Configurada' : 'Link Inválido'}
                        </CardTitle>
                        <CardDescription>
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/login">Ir para o Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Configure sua Senha</CardTitle>
                    <CardDescription>
                        Bem-vindo ao <span className="font-semibold">{produtoNome}</span>!<br />
                        Crie uma senha para acessar seu conteúdo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200 text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={email}
                                disabled
                                className="bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repita a senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Configurando...
                                </>
                            ) : (
                                'Criar Senha e Acessar'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-muted-foreground">Carregando...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <SetupPasswordContent />
        </Suspense>
    )
}
