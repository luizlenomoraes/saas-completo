'use client'

import { useEffect, useState, useCallback } from 'react'

declare global {
    interface Window {
        MercadoPago: any
    }
}

interface CardFormData {
    cardNumber: string
    cardholderName: string
    cardExpirationMonth: string
    cardExpirationYear: string
    securityCode: string
    identificationType: string
    identificationNumber: string
}

interface TokenResult {
    token: string
    issuerId: string
    paymentMethodId: string
    lastFourDigits: string
}

export function useMercadoPago(publicKey: string | undefined) {
    const [mp, setMp] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Carregar SDK do Mercado Pago
    useEffect(() => {
        if (!publicKey) return

        // Verificar se já foi carregado
        if (window.MercadoPago) {
            try {
                const mpInstance = new window.MercadoPago(publicKey, {
                    locale: 'pt-BR',
                })
                setMp(mpInstance)
                setIsLoaded(true)
            } catch (err: any) {
                setError(err.message)
            }
            return
        }

        // Carregar script
        const script = document.createElement('script')
        script.src = 'https://sdk.mercadopago.com/js/v2'
        script.async = true

        script.onload = () => {
            try {
                const mpInstance = new window.MercadoPago(publicKey, {
                    locale: 'pt-BR',
                })
                setMp(mpInstance)
                setIsLoaded(true)
            } catch (err: any) {
                setError(err.message)
            }
        }

        script.onerror = () => {
            setError('Erro ao carregar SDK do Mercado Pago')
        }

        document.head.appendChild(script)

        return () => {
            // Não remover script pois pode ser usado por outros componentes
        }
    }, [publicKey])

    // Criar token do cartão
    const createCardToken = useCallback(async (
        cardData: CardFormData
    ): Promise<TokenResult> => {
        if (!mp) {
            throw new Error('SDK do Mercado Pago não carregado')
        }

        try {
            // Buscar issuer e payment method pelo número do cartão
            const bin = cardData.cardNumber.replace(/\D/g, '').slice(0, 6)

            // Obter método de pagamento
            const paymentMethodsResponse = await fetch(
                `https://api.mercadopago.com/v1/payment_methods/search?public_key=${mp.publicKey}&bins=${bin}`
            )
            const paymentMethodsData = await paymentMethodsResponse.json()

            const paymentMethodId = paymentMethodsData.results?.[0]?.id || 'visa'
            const issuerId = paymentMethodsData.results?.[0]?.issuer?.id || ''

            // Criar token usando cardTokenObject
            const cardNumber = cardData.cardNumber.replace(/\D/g, '')

            const response = await mp.createCardToken({
                cardNumber: cardNumber,
                cardholderName: cardData.cardholderName,
                cardExpirationMonth: cardData.cardExpirationMonth,
                cardExpirationYear: '20' + cardData.cardExpirationYear,
                securityCode: cardData.securityCode,
                identificationType: cardData.identificationType,
                identificationNumber: cardData.identificationNumber.replace(/\D/g, ''),
            })

            if (response.error) {
                throw new Error(response.error || 'Erro ao tokenizar cartão')
            }

            return {
                token: response.id,
                issuerId: issuerId.toString(),
                paymentMethodId,
                lastFourDigits: cardNumber.slice(-4),
            }
        } catch (err: any) {
            console.error('[MP SDK] Erro ao criar token:', err)
            throw new Error(
                err.message || 'Erro ao processar dados do cartão'
            )
        }
    }, [mp])

    // Obter tipos de documento
    const getIdentificationTypes = useCallback(async () => {
        if (!mp) return []

        try {
            const types = await mp.getIdentificationTypes()
            return types
        } catch (err) {
            console.error('[MP SDK] Erro ao buscar tipos de documento:', err)
            return [{ id: 'CPF', name: 'CPF' }]
        }
    }, [mp])

    // Obter parcelas
    const getInstallments = useCallback(async (
        amount: number,
        bin: string
    ) => {
        if (!mp || bin.length < 6) return []

        try {
            const installments = await mp.getInstallments({
                amount: amount.toString(),
                bin,
            })
            return installments[0]?.payer_costs || []
        } catch (err) {
            console.error('[MP SDK] Erro ao buscar parcelas:', err)
            return []
        }
    }, [mp])

    return {
        mp,
        isLoaded,
        error,
        createCardToken,
        getIdentificationTypes,
        getInstallments,
    }
}
