'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UrgencyTimerProps {
    minutes: number
    storageKey?: string
    onExpire?: () => void
    className?: string
}

export function UrgencyTimer({
    minutes,
    storageKey = 'checkout_timer',
    onExpire,
    className
}: UrgencyTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isExpired, setIsExpired] = useState(false)

    // Inicializar timer do localStorage ou criar novo
    useEffect(() => {
        const stored = localStorage.getItem(storageKey)

        if (stored) {
            const endTime = parseInt(stored, 10)
            const remaining = Math.max(0, endTime - Date.now())

            if (remaining > 0) {
                setTimeLeft(Math.floor(remaining / 1000))
            } else {
                setIsExpired(true)
                setTimeLeft(0)
            }
        } else {
            // Criar novo timer
            const endTime = Date.now() + minutes * 60 * 1000
            localStorage.setItem(storageKey, endTime.toString())
            setTimeLeft(minutes * 60)
        }
    }, [minutes, storageKey])

    // Countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval)
                    setIsExpired(true)
                    onExpire?.()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [timeLeft, onExpire])

    // Formatar tempo
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, [])

    if (timeLeft === null) return null

    const isLow = timeLeft < 60 // Menos de 1 minuto

    return (
        <div
            className={cn(
                'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
                isExpired
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                    : isLow
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 animate-pulse'
                        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800',
                className
            )}
        >
            {isExpired ? (
                <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                        Oferta expirada!
                    </span>
                </>
            ) : (
                <>
                    <Clock className={cn('w-5 h-5', isLow ? 'text-orange-500' : 'text-yellow-600')} />
                    <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium', isLow ? 'text-orange-600 dark:text-orange-400' : 'text-yellow-700 dark:text-yellow-400')}>
                            Oferta expira em
                        </span>
                        <span
                            className={cn(
                                'font-mono font-bold text-lg px-2 py-0.5 rounded',
                                isLow
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-yellow-500 text-yellow-900'
                            )}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}
