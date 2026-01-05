// Tipos e interfaces para os gateways de pagamento
// Equivalente às structs/tipos usados nos arquivos PHP de gateways

export interface PaymentCustomer {
    name: string
    email: string
    cpf: string
    phone: string
    address?: {
        cep: string
        street: string
        number: string
        complement?: string
        neighborhood: string
        city: string
        state: string
    }
}

export interface PaymentProduct {
    id: string
    name: string
    price: number
    quantity: number
}

export interface PaymentRequest {
    transactionId: string
    amount: number
    customer: PaymentCustomer
    products: PaymentProduct[]
    paymentMethod: 'pix' | 'credit_card' | 'boleto'
    installments?: number
    cardToken?: string
    notificationUrl: string
    // UTM
    utm?: {
        source?: string
        medium?: string
        campaign?: string
    }
}

export interface PixPaymentResult {
    success: boolean
    transactionId: string
    status: 'pending' | 'approved' | 'rejected'
    qrCode: string
    qrCodeBase64: string
    copyPaste: string
    expirationDate: string
    error?: string
}

export interface CardPaymentResult {
    success: boolean
    transactionId: string
    status: 'pending' | 'approved' | 'rejected' | 'in_process'
    error?: string
    errorCode?: string
}

export interface BoletoPaymentResult {
    success: boolean
    transactionId: string
    status: 'pending'
    boletoUrl: string
    barcode: string
    dueDate: string
    error?: string
}

export type PaymentResult = PixPaymentResult | CardPaymentResult | BoletoPaymentResult

export interface GatewayCredentials {
    // Mercado Pago
    mpAccessToken?: string
    mpPublicKey?: string
    // PushinPay
    pushinpayToken?: string
    // Efí
    efiClientId?: string
    efiClientSecret?: string
    efiCertificatePath?: string
    efiPixKey?: string
    efiPayeeCode?: string
    // Beehive
    beehiveSecretKey?: string
    beehivePublicKey?: string
    // Hypercash
    hypercashSecretKey?: string
    hypercashPublicKey?: string
}

export interface WebhookPayload {
    event: string
    transactionId: string
    status: string
    amount: number
    paymentMethod: string
    customer: {
        email: string
        name: string
        cpf?: string
        phone?: string
    }
    products: PaymentProduct[]
    timestamp: string
    utm?: {
        source?: string
        medium?: string
        campaign?: string
        src?: string
        sck?: string
    }
}

// Status mapping entre gateways
export const STATUS_MAP: Record<string, Record<string, string>> = {
    mercadopago: {
        approved: 'approved',
        pending: 'pending',
        authorized: 'pending',
        in_process: 'pending',
        in_mediation: 'pending',
        rejected: 'rejected',
        cancelled: 'cancelled',
        refunded: 'refunded',
        charged_back: 'charged_back',
    },
    pushinpay: {
        paid: 'approved',
        pending: 'pending',
        expired: 'cancelled',
        refunded: 'refunded',
    },
    efi: {
        paid: 'approved',
        waiting: 'pending',
        unpaid: 'pending',
        refunded: 'refunded',
        contested: 'charged_back',
        cancelled: 'cancelled',
    },
    beehive: {
        approved: 'approved',
        pending: 'pending',
        rejected: 'rejected',
        refunded: 'refunded',
        chargeback: 'charged_back',
    },
    hypercash: {
        approved: 'approved',
        pending: 'pending',
        denied: 'rejected',
        refunded: 'refunded',
        chargeback: 'charged_back',
    },
}

/**
 * Normaliza status do gateway para status interno
 */
export function normalizeStatus(gateway: string, externalStatus: string): string {
    const map = STATUS_MAP[gateway]
    if (!map) return externalStatus
    return map[externalStatus.toLowerCase()] || externalStatus
}

/**
 * Formata CPF removendo caracteres especiais
 */
export function formatCpfForGateway(cpf: string): string {
    return cpf.replace(/\D/g, '')
}

/**
 * Formata telefone removendo caracteres especiais
 */
export function formatPhoneForGateway(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    // Adicionar código do país se não tiver
    if (digits.length === 10 || digits.length === 11) {
        return '55' + digits
    }
    return digits
}

/**
 * Gera ID de transação único
 */
export function generateTransactionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`.toUpperCase()
}
