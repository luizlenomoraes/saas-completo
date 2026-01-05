/**
 * Arquivo de exportação central dos gateways
 */

// Tipos compartilhados
export * from './types'

// Gateways
export * as mercadopago from './mercadopago'
export * as pushinpay from './pushinpay'

// TODO: Implementar demais gateways
// export * as efi from './efi'
// export * as beehive from './beehive'
// export * as hypercash from './hypercash'

import { GatewayCredentials, PaymentRequest, PaymentResult } from './types'
import * as mercadopago from './mercadopago'
import * as pushinpay from './pushinpay'

/**
 * Processa pagamento usando o gateway apropriado
 */
export async function processPayment(
    gateway: string,
    paymentMethod: 'pix' | 'credit_card' | 'boleto',
    credentials: GatewayCredentials,
    request: PaymentRequest
): Promise<PaymentResult> {
    switch (gateway) {
        case 'mercadopago':
            if (paymentMethod === 'pix') {
                return mercadopago.createPixPayment(
                    { accessToken: credentials.mpAccessToken! },
                    request
                )
            } else if (paymentMethod === 'credit_card') {
                return mercadopago.createCardPayment(
                    { accessToken: credentials.mpAccessToken! },
                    request
                )
            } else {
                return mercadopago.createBoletoPayment(
                    { accessToken: credentials.mpAccessToken! },
                    request
                )
            }

        case 'pushinpay':
            if (paymentMethod === 'pix') {
                return pushinpay.createPixPayment(
                    { token: credentials.pushinpayToken! },
                    request
                )
            }
            throw new Error('PushinPay suporta apenas Pix')

        // TODO: Implementar demais gateways
        case 'efi':
            throw new Error('Gateway Efí ainda não implementado')

        case 'beehive':
            throw new Error('Gateway Beehive ainda não implementado')

        case 'hypercash':
            throw new Error('Gateway Hypercash ainda não implementado')

        default:
            throw new Error(`Gateway desconhecido: ${gateway}`)
    }
}

/**
 * Consulta status de pagamento
 */
export async function getPaymentStatus(
    gateway: string,
    credentials: GatewayCredentials,
    paymentId: string
): Promise<{ status: string; statusDetail?: string }> {
    switch (gateway) {
        case 'mercadopago':
            return mercadopago.getPaymentStatus(
                { accessToken: credentials.mpAccessToken! },
                paymentId
            )

        case 'pushinpay':
            const result = await pushinpay.getPaymentStatus(
                { token: credentials.pushinpayToken! },
                paymentId
            )
            return { status: pushinpay.normalizeStatus(result.status) }

        default:
            return { status: 'unknown' }
    }
}
