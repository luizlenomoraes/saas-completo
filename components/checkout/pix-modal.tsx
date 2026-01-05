'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Copy, Check, Clock, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'

interface PixModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
    amount: number
    qrCode?: string
    qrCodeBase64?: string
    copyPaste?: string
    expiresAt?: string
    onPaymentConfirmed?: () => void
}

export function PixModal({
    isOpen,
    onClose,
    orderId,
    amount,
    qrCode,
    qrCodeBase64,
    copyPaste,
    expiresAt,
    onPaymentConfirmed,
}: PixModalProps) {
    const [copied, setCopied] = useState(false)
    const [status, setStatus] = useState<'pending' | 'approved' | 'expired'>('pending')
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    // Calcular tempo restante
    useEffect(() => {
        if (!expiresAt) return

        const calculateTimeLeft = () => {
            const expires = new Date(expiresAt).getTime()
            const now = Date.now()
            const diff = Math.max(0, expires - now)
            return Math.floor(diff / 1000)
        }

        setTimeLeft(calculateTimeLeft())

        const interval = setInterval(() => {
            const remaining = calculateTimeLeft()
            setTimeLeft(remaining)
            if (remaining <= 0) {
                setStatus('expired')
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [expiresAt])

    // Polling de status
    useEffect(() => {
        if (!isOpen || status !== 'pending') return

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/payments/status/${orderId}`)
                const data = await response.json()

                if (data.status === 'APPROVED') {
                    setStatus('approved')
                    onPaymentConfirmed?.()
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error)
            }
        }

        // Verificar a cada 3 segundos
        const interval = setInterval(checkStatus, 3000)

        // Verificar imediatamente também
        checkStatus()

        return () => clearInterval(interval)
    }, [isOpen, orderId, status, onPaymentConfirmed])

    // Copiar código Pix
    const handleCopy = useCallback(async () => {
        if (!copyPaste) return

        try {
            await navigator.clipboard.writeText(copyPaste)
            setCopied(true)
            toast.success('Código Pix copiado!')
            setTimeout(() => setCopied(false), 3000)
        } catch (error) {
            toast.error('Erro ao copiar código')
        }
    }, [copyPaste])

    // Formatar tempo
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {status === 'approved' ? (
                        <>
                            <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold">Pagamento Confirmado!</h2>
                        </>
                    ) : status === 'expired' ? (
                        <>
                            <Clock className="w-16 h-16 mx-auto mb-3 text-yellow-300" />
                            <h2 className="text-2xl font-bold">QR Code Expirado</h2>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-3xl">📱</span>
                            </div>
                            <h2 className="text-2xl font-bold">Pague com Pix</h2>
                            <p className="text-white/80 mt-1">
                                {formatCurrency(amount)}
                            </p>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'approved' ? (
                        <div className="text-center space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                Seu pagamento foi confirmado com sucesso! Você receberá um email com os detalhes do seu pedido.
                            </p>
                            <Button
                                onClick={() => window.location.href = `/obrigado?order=${orderId}`}
                                className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600"
                            >
                                Acessar Minha Compra
                            </Button>
                        </div>
                    ) : status === 'expired' ? (
                        <div className="text-center space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                O tempo para pagamento expirou. Por favor, tente novamente.
                            </p>
                            <Button onClick={onClose} variant="outline" className="w-full py-5">
                                Fechar
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Timer */}
                            {timeLeft !== null && (
                                <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Expira em</span>
                                    <span className="font-mono font-bold text-orange-500">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            )}

                            {/* QR Code */}
                            {qrCodeBase64 && (
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-white rounded-xl shadow-inner">
                                        <Image
                                            src={`data:image/png;base64,${qrCodeBase64}`}
                                            alt="QR Code Pix"
                                            width={200}
                                            height={200}
                                            className="w-48 h-48"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Instruções */}
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                                    Abra o app do seu banco
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                                    Escolha pagar com Pix
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                                    Escaneie o QR Code ou copie o código
                                </p>
                            </div>

                            {/* Copiar código */}
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                className={cn(
                                    'w-full py-5 border-2',
                                    copied && 'border-green-500 text-green-600'
                                )}
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Código Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copiar Código Pix
                                    </>
                                )}
                            </Button>

                            {/* Status de verificação */}
                            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Aguardando pagamento...</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
