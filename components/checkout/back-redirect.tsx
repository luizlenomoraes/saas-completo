'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Gift, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackRedirectProps {
    message: string
    enabled?: boolean
    onClose?: () => void
}

export function BackRedirect({
    message,
    enabled = true,
    onClose
}: BackRedirectProps) {
    const [isVisible, setIsVisible] = useState(false)
    const hasTriggered = useRef(false)

    useEffect(() => {
        if (!enabled) return

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasTriggered.current) return

            // Mostrar modal em vez de sair
            e.preventDefault()
            e.returnValue = ''
            return ''
        }

        const handleMouseLeave = (e: MouseEvent) => {
            if (hasTriggered.current) return

            // Detectar intenção de sair (mouse no topo da tela)
            if (e.clientY <= 0) {
                hasTriggered.current = true
                setIsVisible(true)
            }
        }

        // Para mobile: detectar tentativa de voltar usando history
        const handlePopState = () => {
            if (hasTriggered.current) return

            hasTriggered.current = true
            // Voltar para a página para que o modal apareça
            window.history.pushState(null, '', window.location.href)
            setIsVisible(true)
        }

        // Adicionar estado inicial para detectar back
        window.history.pushState(null, '', window.location.href)

        document.addEventListener('mouseleave', handleMouseLeave)
        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('popstate', handlePopState)

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave)
            window.removeEventListener('beforeunload', handleBeforeUnload)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [enabled])

    const handleClose = () => {
        setIsVisible(false)
        onClose?.()
    }

    const handleStay = () => {
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className={cn(
                    'relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden',
                    'animate-slide-in-right'
                )}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header gradient */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        Espere!
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleStay}
                            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                            <Gift className="mr-2 h-5 w-5" />
                            Quero Aproveitar!
                        </Button>

                        <button
                            onClick={handleClose}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Não, quero sair mesmo assim
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
