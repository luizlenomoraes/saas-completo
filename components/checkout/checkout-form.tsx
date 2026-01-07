'use client'

import { useState, useCallback } from 'react'
import { Loader2, ShieldCheck, Lock, AlertCircle, ShoppingCart, ChevronUp, ChevronDown } from 'lucide-react'
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
} from '@/components/checkout' // Keep using this if it works, or switch to relative if circular deps occur
import { formatCurrency, isValidCPF, isValidEmail, cleanDigits, hexToHSL } from '@/lib/utils'

// Tipos devem bater com o que vem do servidor
export interface Product {
    id: string
    name: string
    description: string | null
    price: number
    previousPrice: number | null
    image: string | null
    deliveryType: string
    gateway: string
}

export interface OrderBump {
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

export interface CheckoutConfig {
    primaryColor: string
    backgroundColor: string
    textColor: string
    borderRadius: string
    boxShadow: string
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

export interface CheckoutData {
    product: Product
    seller: { id: string; name: string | null }
    orderBumps: OrderBump[]
    availableGateways: string[]
    gatewayKeys: Record<string, { publicKey?: string | null }>
    paymentMethods: PaymentMethod[]
    checkoutConfig: CheckoutConfig
}

interface CheckoutFormProps {
    checkoutData: CheckoutData
    hash: string
}

export default function CheckoutForm({ checkoutData, hash }: CheckoutFormProps) {
    // Estados
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)

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

    // Inicializar com o primeiro método de pagamento se existir
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
        checkoutData.paymentMethods.length > 0 ? (checkoutData.paymentMethods[0] as PaymentMethod) : null
    )

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

    const { product, orderBumps, paymentMethods, checkoutConfig } = checkoutData

    // Mapeamento de estilos
    const getRadiusClass = (size: string) => {
        const map: Record<string, string> = {
            'none': 'rounded-none',
            'md': 'rounded-md',
            'lg': 'rounded-lg',
            'xl': 'rounded-xl',
            '2xl': 'rounded-2xl',
        }
        return map[size] || 'rounded-xl'
    }

    const getShadowClass = (size: string) => {
        const map: Record<string, string> = {
            'none': 'shadow-none',
            'sm': 'shadow-sm',
            'md': 'shadow',
            'lg': 'shadow-lg',
            'xl': 'shadow-xl',
        }
        return map[size] || 'shadow-sm'
    }

    const cardClass = `${getRadiusClass(checkoutConfig.borderRadius)} ${getShadowClass(checkoutConfig.boxShadow)} border-gray-100 dark:border-gray-800`
    const buttonRadius = getRadiusClass(checkoutConfig.borderRadius)

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
                // AQUI ESTÁ O SEGREDO DO LUXO
                '--primary': hexToHSL(checkoutConfig.primaryColor),
                '--primary-foreground': '0 0% 100%', // Texto branco no botão
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
                {/* Mobile Order Summary Accordion */}
                <div className="lg:hidden mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                        onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                        className="w-full p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <ShoppingCart className="w-4 h-4" />
                            <span>{isMobileSummaryOpen ? 'Ocultar' : 'Ver'} resumo e ofertas</span>
                            {isMobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(total)}
                        </span>
                    </button>

                    {isMobileSummaryOpen && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <OrderSummary
                                mainProduct={product}
                                orderBumps={orderBumps}
                                selectedBumps={selectedBumps}
                                onToggleBump={handleToggleBump}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}
                </div>

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
                        <Card className={cardClass}>
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
                            <Card className={cardClass}>
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
                        <Card className={cardClass}>
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
                            <Card className={cardClass}>
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
                            <Card className={`hidden lg:block ${cardClass}`}>
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
                                className={`w-full py-6 text-lg font-bold hover:shadow-xl transition-all text-white ${buttonRadius} ${getShadowClass(checkoutConfig.boxShadow)}`}
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
