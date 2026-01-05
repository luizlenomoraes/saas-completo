'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface OrderData {
    orderId: string
    status: string
    productName: string
    amount: number
}

function ThankYouContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('order')

    const [isLoading, setIsLoading] = useState(true)
    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) {
                setError('Pedido não encontrado')
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch(`/api/payments/status/${orderId}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao carregar pedido')
                }

                setOrderData(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
    }, [orderId])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando pedido...</p>
                </div>
            </div>
        )
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Pedido não encontrado
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {error || 'Não foi possível carregar os detalhes do seu pedido.'}
                            </p>
                            <Link href="/">
                                <Button>Voltar ao Início</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isPending = orderData.status === 'PENDING'
    const isApproved = orderData.status === 'APPROVED'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header com confetti background */}
                <div className="text-center mb-8">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isApproved
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                        {isApproved ? (
                            <CheckCircle className="w-14 h-14 text-green-500" />
                        ) : (
                            <Loader2 className="w-14 h-14 text-yellow-500 animate-spin" />
                        )}
                    </div>

                    <h1 className={`text-3xl font-bold mb-2 ${isApproved
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {isApproved ? 'Compra Confirmada!' : 'Aguardando Pagamento'}
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400">
                        {isApproved
                            ? 'Parabéns! Seu pagamento foi aprovado com sucesso.'
                            : 'Seu pedido foi registrado e estamos aguardando a confirmação do pagamento.'
                        }
                    </p>
                </div>

                {/* Detalhes do Pedido */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Número do Pedido</span>
                                <span className="font-mono font-medium text-gray-900 dark:text-white">
                                    #{orderData.orderId.slice(-8).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Produto</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {orderData.productName}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Valor</span>
                                <span className="font-bold text-lg text-green-600">
                                    {formatCurrency(orderData.amount)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${isApproved
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {isApproved ? 'Aprovado' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Próximos Passos */}
                {isApproved && (
                    <Card className="mb-6 border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                                Próximos Passos
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Verifique seu email
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Enviamos os dados de acesso para seu email cadastrado.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Download className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Acesse o conteúdo
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Seu acesso à área de membros já está liberado!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {isApproved ? (
                        <>
                            <Button
                                className="flex-1 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                asChild
                            >
                                <Link href="/dashboard">
                                    Acessar Área de Membros
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <div className="flex-1 text-center">
                            <p className="text-sm text-gray-500 mb-4">
                                Esta página será atualizada automaticamente quando o pagamento for confirmado.
                            </p>
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Dúvidas? Entre em contato com nosso suporte.
                </p>
            </div>
        </div>
    )
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    )
}
