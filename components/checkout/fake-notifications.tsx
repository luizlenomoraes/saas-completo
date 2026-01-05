'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FakeNotification {
    name: string
    location: string
    product: string
    time: string
}

const NAMES = [
    'Maria S.', 'João P.', 'Ana L.', 'Pedro M.', 'Julia R.',
    'Carlos H.', 'Fernanda C.', 'Lucas G.', 'Beatriz A.', 'Rafael V.',
    'Camila F.', 'Bruno T.', 'Amanda N.', 'Diego O.', 'Larissa D.',
    'Thiago B.', 'Patricia K.', 'Rodrigo L.', 'Isabela M.', 'Gabriel S.',
]

const LOCATIONS = [
    'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG',
    'Curitiba, PR', 'Porto Alegre, RS', 'Salvador, BA',
    'Brasília, DF', 'Fortaleza, CE', 'Recife, PE', 'Campinas, SP',
    'Florianópolis, SC', 'Goiânia, GO', 'Manaus, AM', 'Vitória, ES',
]

const TIMES = [
    'agora mesmo', 'há 1 minuto', 'há 2 minutos', 'há 3 minutos',
    'há 5 minutos', 'há 8 minutos', 'há 10 minutos',
]

interface FakeNotificationsProps {
    productName: string
    intervalMs?: number
    maxVisible?: number
    enabled?: boolean
}

export function FakeNotifications({
    productName,
    intervalMs = 15000,
    maxVisible = 1,
    enabled = true,
}: FakeNotificationsProps) {
    const [notifications, setNotifications] = useState<(FakeNotification & { id: string })[]>([])
    const timeoutRef = useRef<NodeJS.Timeout>()

    const generateNotification = useCallback((): FakeNotification & { id: string } => {
        return {
            id: Math.random().toString(36).slice(2),
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            product: productName,
            time: TIMES[Math.floor(Math.random() * TIMES.length)],
        }
    }, [productName])

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    useEffect(() => {
        if (!enabled) return

        // Primeira notificação após delay inicial
        const initialDelay = 5000 + Math.random() * 5000

        const showNotification = () => {
            const newNotif = generateNotification()
            setNotifications((prev) => {
                const updated = [...prev, newNotif].slice(-maxVisible)
                return updated
            })

            // Auto-remove após 5 segundos
            setTimeout(() => removeNotification(newNotif.id), 5000)

            // Próxima notificação com variação
            const nextDelay = intervalMs + Math.random() * 5000
            timeoutRef.current = setTimeout(showNotification, nextDelay)
        }

        timeoutRef.current = setTimeout(showNotification, initialDelay)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [enabled, intervalMs, maxVisible, generateNotification, removeNotification])

    if (!enabled || notifications.length === 0) return null

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={cn(
                        'flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700',
                        'max-w-xs animate-slide-in-right'
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notif.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {notif.location}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Comprou {notif.time}
                        </p>
                    </div>
                    <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
