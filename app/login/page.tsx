'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session, status } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const callbackUrl = searchParams.get('callbackUrl')

    // Se já está logado ao carregar a página, redirecionar baseado no tipo
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            console.log('useEffect detected authenticated user:', session.user.type)
            if (callbackUrl) {
                window.location.href = callbackUrl
            } else if (session.user.type === 'admin') {
                window.location.href = '/admin'
            } else {
                window.location.href = '/dashboard'
            }
        }
    }, [status, session, callbackUrl])

    function _redirectByUserType(userType: string) {
        if (callbackUrl) {
            router.push(callbackUrl)
            return
        }

        switch (userType) {
            case 'admin':
                router.push('/admin')
                break
            case 'infoprodutor':
                router.push('/dashboard')
                break
            default:
                router.push('/dashboard')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // 1. Tentar login como Admin/Infoprodutor (NextAuth)
            const resNextAuth = await signIn('credentials', {
                redirect: false,
                email,
                password,
            })

            if (resNextAuth?.ok) {
                if (callbackUrl) {
                    window.location.href = callbackUrl
                    return
                }

                // Pequeno delay para garantir que o JWT foi processado
                await new Promise(resolve => setTimeout(resolve, 500))

                // Buscar dados da sessão para verificar tipo do usuário
                const sessionRes = await fetch('/api/auth/session', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                })
                const sessionData = await sessionRes.json()

                console.log('Session data:', sessionData) // Debug

                // Redirecionar baseado no tipo
                if (sessionData?.user?.type === 'admin') {
                    window.location.href = '/admin'
                } else {
                    window.location.href = '/dashboard'
                }
                return
            }

            // 2. Se falhar, tentar login como Membro (Custom API)
            const res = await fetch('/api/auth/member/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                // Se ambos falharem, assume erro de credenciais
                throw new Error('Credenciais inválidas')
            }

            // Redirecionar Membro
            router.push(data.redirect || '/members')

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao fazer login')
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card border-gold-glow">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F6D764] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                            <Bot className="h-8 w-8 text-black" />
                            <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-[#F6D764] animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        <span className="text-gradient-gold">AgentiVerso</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Acesse o universo da inteligência
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
