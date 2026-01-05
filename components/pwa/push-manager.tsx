'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface PushManagerProps {
    vapidPublicKey?: string
}

export function PushManager({ vapidPublicKey }: PushManagerProps) {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && vapidPublicKey) {
            setIsSupported(true)
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true)
                    }
                })
            })
        }
    }, [vapidPublicKey])

    const subscribe = async () => {
        if (!vapidPublicKey) return toast.error("Chave pública VAPID não configurada.")

        setLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

            // Gravar no backend
            const res = await fetch('/api/pwa/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            })

            if (!res.ok) throw new Error('Falha ao salvar inscrição')

            setIsSubscribed(true)
            toast.success('Você receberá notificações!')
        } catch (e: any) {
            console.error(e)
            toast.error('Erro ao ativar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isSupported) return null

    return (
        <Button
            variant={isSubscribed ? "secondary" : "default"}
            size="sm"
            onClick={subscribe}
            disabled={isSubscribed || loading}
            className={!isSubscribed ? "bg-[#D4AF37] hover:bg-[#B5952F] text-black" : ""}
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                isSubscribed ? <Bell className="mr-2 h-4 w-4 text-green-600" /> : <BellOff className="mr-2 h-4 w-4" />
            )}
            {isSubscribed ? 'Notificações Ativas' : 'Receber Notificações'}
        </Button>
    )
}
