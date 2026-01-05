'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface SubscribeFormProps {
    planId: string
    planName: string
    price: number
    isFree: boolean
}

export function SubscribeForm({ planId, price, isFree }: SubscribeFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [method, setMethod] = useState('mercadopago')

    const handleSubscribe = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/saas/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, method })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Erro ao processar')

            if (data.url) {
                // Redireciona para checkout externo
                window.location.href = data.url
            } else if (data.success) {
                // Assinatura grátis ou sucesso imediato
                toast.success('Assinatura ativada com sucesso!')
                router.push('/dashboard')
            }

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFree) {
        return (
            <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Este plano é gratuito. Clique abaixo para ativar.</p>
                <Button
                    className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Ativar Plano Grátis'}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <RadioGroup defaultValue="mercadopago" onValueChange={setMethod} className="space-y-3">
                <div className="flex items-center space-x-3 border border-zinc-800 p-4 rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                    <RadioGroupItem value="mercadopago" id="mp" />
                    <Label htmlFor="mp" className="flex items-center gap-2 cursor-pointer font-medium text-white">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                        Mercado Pago (Cartão/Pix)
                    </Label>
                </div>
            </RadioGroup>

            <div className="space-y-2">
                <Button
                    className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold h-12 text-lg"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : `Pagar R$ ${price.toFixed(2)}`}
                </Button>
                <div className="flex justify-center items-center gap-2 text-xs text-zinc-500">
                    <Lock className="w-3 h-3" />
                    Pagamento seguro e criptografado
                </div>
            </div>
        </div>
    )
}
