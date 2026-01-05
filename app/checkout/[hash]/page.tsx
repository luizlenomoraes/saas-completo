'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ShieldCheck, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    CustomerForm,
    CustomerData,
    AddressForm,
    AddressData,
    PaymentMethodSelector,
    PaymentMethod,
    OrderSummary,
    UrgencyTimer,
    FakeNotifications,
    BannerCarousel,
    YouTubeEmbed,
    BackRedirect,
    PixModal,
    CreditCardForm,
    CardData,
} from '@/components/checkout'
import { useMercadoPago } from '@/hooks'
import { formatCurrency, isValidCPF, isValidEmail, cleanDigits } from '@/lib/utils'

// Tipos para dados da API
interface Product {
    id: string
    name: string
    description: string | null
    price: number
    previousPrice: number | null
    image: string | null
    deliveryType: string
    gateway: string
}

interface OrderBump {
    id: string
    headline: string
    description: string | null
    product: {
        id: string
        name: string
        description: string | null
        price: number
        previousPrice: number | null
        image: string | null
    }
}

interface CheckoutConfig {
    primaryColor: string
    backgroundColor: string
    textColor: string
    logoUrl?: string
    timerEnabled: boolean
    timerDuration: number
    askPhone: boolean
    askCpf: boolean
    socialProofEnabled: boolean

    // Legacy
    showBanner: boolean
    bannerImages: string[]
    youtubeVideoId: string | null
    backRedirect: boolean
    backRedirectMessage: string
}

interface CheckoutData {
    product: Product
    seller: { id: string; name: string | null }
    orderBumps: OrderBump[]
    availableGateways: string[]
    gatewayKeys: Record<string, { publicKey?: string | null }>
    paymentMethods: PaymentMethod[]
    checkoutConfig: CheckoutConfig
}

export default function CheckoutPage() {
    const params = useParams()
    const hash = params.hash as string

    // Estados
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)

    // Dados do formulário
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: '',
        email: '',
        cpf: '',
        phone: '',
    })

    const [addressData, setAddressData] = useState<AddressData>({
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
    })

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [selectedBumps, setSelectedBumps] = useState<string[]>([])

    // Estado para o modal de Pix
    const [pixModalOpen, setPixModalOpen] = useState(false)
    const [pixData, setPixData] = useState<{
        orderId: string
        amount: number
        qrCode?: string
        qrCodeBase64?: string
        copyPaste?: string
        expiresAt?: string
    } | null>(null)

    // Estado para dados do cartão de crédito
    const [cardData, setCardData] = useState<CardData>({
        number: '',
        name: '',
        expiry: '',
        cvv: '',
        installments: 1,
    })

    // Carregar dados do produto
    useEffect(() => {
        async function loadCheckout() {
            try {
                setIsLoading(true)
                setError(null)

                const response = await fetch(`/api/checkout/${hash}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao carregar checkout')
                }

                setCheckoutData(data)

                // Selecionar primeiro método de pagamento disponível
                if (data.paymentMethods.length > 0) {
                    setPaymentMethod(data.paymentMethods[0] as PaymentMethod)
                }
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar produto')
            } finally {
                setIsLoading(false)
            }
        }

        if (hash) {
            loadCheckout()
        }
    }, [hash])

    // Toggle order bump
    const handleToggleBump = useCallback((bumpId: string) => {
        setSelectedBumps((prev) =>
            prev.includes(bumpId)
                ? prev.filter((id) => id !== bumpId)
                : [...prev, bumpId]
        )
    }, [])

    // Validar formulário
    const validateForm = useCallback((): boolean => {
        // Validar dados do cliente
        if (!customerData.name || customerData.name.length < 2) {
            toast.error('Digite seu nome completo')
            return false
        }

        if (!customerData.email || !isValidEmail(customerData.email)) {
            toast.error('Digite um email válido')
            return false
        }

        if (!isValidCPF(customerData.cpf)) {
            toast.error('Digite um CPF válido')
            return false
        }

        const phoneDigits = cleanDigits(customerData.phone)
        if (phoneDigits.length < 10) {
            toast.error('Digite um telefone válido')
            return false
        }

        // Validar endereço se produto físico ou boleto (exigência do BC)
        if (checkoutData?.product.deliveryType === 'PHYSICAL' || paymentMethod === 'boleto') {
            const cepDigits = cleanDigits(addressData.cep)
            if (cepDigits.length !== 8) {
                toast.error('Digite um CEP válido')
                return false
            }
            if (!addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city || !addressData.state) {
                toast.error('Preencha todo o endereço para emissão da nota/boleto')
                return false
            }
        }

        // Validar método de pagamento
        if (!paymentMethod) {
            toast.error('Selecione uma forma de pagamento')
            return false
        }

        return true
    }, [customerData, addressData, paymentMethod, checkoutData])

    // Submeter pedido
    const handleSubmit = async () => {
        if (!validateForm() || !checkoutData) return

        setIsSubmitting(true)

        try {
            // Calcular total
            const bumpsTotal = checkoutData.orderBumps
                .filter((b) => selectedBumps.includes(b.id))
                .reduce((sum, b) => sum + b.product.price, 0)
            const total = checkoutData.product.price + bumpsTotal

            // Preparar payload
            const payload: any = {
                productId: hash,
                customer: {
                    name: customerData.name,
                    email: customerData.email,
                    cpf: cleanDigits(customerData.cpf),
                    phone: cleanDigits(customerData.phone),
                },
                address: (checkoutData.product.deliveryType === 'PHYSICAL' || paymentMethod === 'boleto') ? {
                    cep: cleanDigits(addressData.cep),
                    street: addressData.street,
                    number: addressData.number,
                    complement: addressData.complement,
                    neighborhood: addressData.neighborhood,
                    city: addressData.city,
                    state: addressData.state,
                } : undefined,
                paymentMethod,
                orderBumps: selectedBumps,
                amount: total,
            }

            // Se for cartão de crédito, tokenizar antes de enviar
            if (paymentMethod === 'credit_card') {
                if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
                    throw new Error('Preencha todos os dados do cartão')
                }

                const [month, year] = cardData.expiry.split('/')

                // Enviar dados do cartão para o servidor tokenizar
                payload.cardData = {
                    cardNumber: cleanDigits(cardData.number),
                    cardholderName: cardData.name,
                    cardExpirationMonth: month,
                    cardExpirationYear: year,
                    securityCode: cardData.cvv,
                    installments: cardData.installments || 1,
                    identificationType: 'CPF',
                    identificationNumber: cleanDigits(customerData.cpf),
                }
            }

            const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao processar pagamento')
            }

            // Sucesso - redirecionar ou mostrar QR code
            if (paymentMethod === 'pix' && result.pixData) {
                // Mostrar modal com QR Code
                setPixData({
                    orderId: result.orderId,
                    amount: total,
                    qrCode: result.pixData.qrCode,
                    qrCodeBase64: result.pixData.qrCodeBase64,
                    copyPaste: result.pixData.copyPaste,
                    expiresAt: result.pixData.expiresAt,
                })
                setPixModalOpen(true)
            } else if (result.redirectUrl) {
                window.location.href = result.redirectUrl
            } else {
                window.location.href = `/obrigado?order=${result.orderId}`
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao processar pagamento')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando checkout...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !checkoutData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Produto não encontrado
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {error || 'O produto que você está procurando não existe ou foi removido.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { product, orderBumps, paymentMethods, checkoutConfig } = checkoutData
    const isPhysicalProduct = product.deliveryType === 'PHYSICAL'

    // Calcular total para exibição no botão
    const bumpsTotal = orderBumps
        .filter((b) => selectedBumps.includes(b.id))
        .reduce((sum, b) => sum + b.product.price, 0)
    const total = product.price + bumpsTotal

    return (
        <div
            className="min-h-screen"
            style={{
                '--primary-color': checkoutConfig.primaryColor,
                backgroundColor: checkoutConfig.backgroundColor || '#f9fafb',
                color: checkoutConfig.textColor || '#111827'
            } as React.CSSProperties}
        >
            {/* Back Redirect Modal */}
            {checkoutConfig.backRedirect && (
                <BackRedirect
                    message={checkoutConfig.backRedirectMessage}
                    enabled={!isSubmitting && !pixModalOpen}
                />
            )}

            {/* Pix Modal */}
            {pixData && (
                <PixModal
                    isOpen={pixModalOpen}
                    onClose={() => setPixModalOpen(false)}
                    orderId={pixData.orderId}
                    amount={pixData.amount}
                    qrCode={pixData.qrCode}
                    qrCodeBase64={pixData.qrCodeBase64}
                    copyPaste={pixData.copyPaste}
                    expiresAt={pixData.expiresAt}
                    onPaymentConfirmed={() => {
                        window.location.href = `/obrigado?order=${pixData.orderId}`
                    }}
                />
            )}

            {/* Fake Notifications */}
            {checkoutConfig.socialProofEnabled && (
                <FakeNotifications
                    productName={product.name}
                    enabled={!isSubmitting}
                />
            )}

            {/* Header with Timer */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
                <div className="max-w-6xl mx-auto px-4 space-y-3">
                    {/* Logo */}
                    {checkoutConfig.logoUrl && (
                        <div className="flex justify-center py-2">
                            <img src={checkoutConfig.logoUrl} alt="Logo" className="max-h-12 object-contain" />
                        </div>
                    )}

                    {/* Timer de Urgência */}
                    {checkoutConfig.timerEnabled && (
                        <UrgencyTimer
                            minutes={checkoutConfig.timerDuration}
                            storageKey={`checkout_timer_${hash}`}
                        />
                    )}

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Lock className="w-4 h-4 text-green-500" />
                        <span>Pagamento 100% seguro</span>
                        <span className="mx-2">•</span>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span>Dados criptografados</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Banner Carousel */}
                {checkoutConfig.showBanner && checkoutConfig.bannerImages.length > 0 && (
                    <div className="mb-8">
                        <BannerCarousel images={checkoutConfig.bannerImages} />
                    </div>
                )}

                {/* YouTube Video */}
                {checkoutConfig.youtubeVideoId && (
                    <div className="mb-8">
                        <YouTubeEmbed
                            videoId={checkoutConfig.youtubeVideoId}
                            title={product.name}
                        />
                    </div>
                )}

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Formulário - 3 colunas */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Dados do Cliente */}
                        <Card>
                            <CardContent className="pt-6">
                                <CustomerForm
                                    data={customerData}
                                    onChange={setCustomerData}
                                    disabled={isSubmitting}
                                />
                            </CardContent>
                        </Card>

                        {/* Endereço (se produto físico ou boleto) */}
                        {(isPhysicalProduct || paymentMethod === 'boleto') && (
                            <Card>
                                <CardContent className="pt-6">
                                    <AddressForm
                                        data={addressData}
                                        onChange={setAddressData}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    {paymentMethod === 'boleto' && (
                                        <p className="mt-4 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Endereço obrigatório para registro do boleto (Banco Central).
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Método de Pagamento */}
                        <Card>
                            <CardContent className="pt-6">
                                <PaymentMethodSelector
                                    selected={paymentMethod}
                                    onChange={setPaymentMethod}
                                    availableMethods={paymentMethods}
                                    disabled={isSubmitting}
                                />
                            </CardContent>
                        </Card>

                        {/* Formulário de Cartão de Crédito */}
                        {paymentMethod === 'credit_card' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <CreditCardForm
                                        data={cardData}
                                        onChange={setCardData}
                                        amount={total}
                                        publicKey={checkoutData.gatewayKeys?.mercadopago?.publicKey ?? undefined}
                                        disabled={isSubmitting}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Resumo - 2 colunas */}
                    <div className="lg:col-span-2">
                        <div className="lg:sticky lg:top-4 space-y-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <OrderSummary
                                        mainProduct={product}
                                        orderBumps={orderBumps}
                                        selectedBumps={selectedBumps}
                                        onToggleBump={handleToggleBump}
                                        disabled={isSubmitting}
                                    />
                                </CardContent>
                            </Card>

                            {/* Botão de Finalizar */}
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !paymentMethod}
                                className="w-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all text-white"
                                style={{
                                    backgroundColor: checkoutConfig.primaryColor
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Finalizar Compra • {formatCurrency(total)}
                                    </>
                                )}
                            </Button>

                            {/* Selos de segurança */}
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>SSL</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Compra Segura</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
