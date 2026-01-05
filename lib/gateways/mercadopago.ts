import { MercadoPagoConfig, Payment } from 'mercadopago'

interface PaymentInput {
    amount: number
    description: string
    paymentMethod: 'pix' | 'credit_card' | 'boleto'
    customer: {
        email: string
        name: string
        cpf: string
        address?: {
            zip_code: string
            street_name: string
            street_number: string
            neighborhood: string
            city: string
            federal_unit: string
        }
    }
    externalReference: string
    cardToken?: string
    installments?: number
}

interface PaymentResult {
    paymentId: string
    status: string
    qrCode?: string
    qrCodeBase64?: string
    copyPaste?: string
    barcode?: string
    boletoUrl?: string
    expiresAt?: string
}

export class MercadoPagoGateway {
    private client: MercadoPagoConfig
    private payment: Payment

    constructor(accessToken: string) {
        this.client = new MercadoPagoConfig({
            accessToken,
            options: { timeout: 10000 },
        })
        this.payment = new Payment(this.client)
    }

    async createPayment(input: PaymentInput): Promise<PaymentResult> {
        const { amount, description, paymentMethod, customer, externalReference, cardToken, installments } = input

        // Criar pagamento baseado no método
        const paymentData: any = {
            transaction_amount: amount,
            description,
            external_reference: externalReference,
            payer: {
                email: customer.email,
                first_name: customer.name.split(' ')[0],
                last_name: customer.name.split(' ').slice(1).join(' ') || customer.name,
                identification: {
                    type: 'CPF',
                    number: customer.cpf.replace(/\D/g, ''),
                },
                address: customer.address ? {
                    zip_code: customer.address.zip_code,
                    street_name: customer.address.street_name,
                    street_number: customer.address.street_number,
                    neighborhood: customer.address.neighborhood,
                    city: customer.address.city,
                    federal_unit: customer.address.federal_unit
                } : undefined
            },
        }

        switch (paymentMethod) {
            case 'pix':
                paymentData.payment_method_id = 'pix'
                paymentData.date_of_expiration = this.getExpirationDate(30) // 30 minutos
                break

            case 'credit_card':
                if (!cardToken) {
                    throw new Error('Token do cartão não fornecido')
                }
                paymentData.token = cardToken
                paymentData.installments = installments || 1
                paymentData.capture = true
                break

            case 'boleto':
                paymentData.payment_method_id = 'bolbradesco'
                paymentData.date_of_expiration = this.getExpirationDate(72 * 60) // 3 dias
                break
        }

        try {
            const response = await this.payment.create({ body: paymentData })

            const result: PaymentResult = {
                paymentId: response.id?.toString() || '',
                status: this.mapStatus(response.status || 'pending'),
            }

            // Dados adicionais baseados no método
            if (paymentMethod === 'pix' && response.point_of_interaction?.transaction_data) {
                const txData = response.point_of_interaction.transaction_data
                result.qrCode = txData.qr_code
                result.qrCodeBase64 = txData.qr_code_base64
                result.copyPaste = txData.qr_code
                result.expiresAt = response.date_of_expiration?.toString()
            }

            if (paymentMethod === 'boleto' && response.transaction_details) {
                result.barcode = (response as any).barcode?.content
                result.boletoUrl = response.transaction_details.external_resource_url
                result.expiresAt = response.date_of_expiration?.toString()
            }

            return result
        } catch (error: any) {
            console.error('[MERCADOPAGO] Erro ao criar pagamento:', error)

            // Extrair mensagem de erro do Mercado Pago
            const errorMessage = error?.cause?.[0]?.description
                || error?.message
                || 'Erro ao processar pagamento no Mercado Pago'

            throw new Error(errorMessage)
        }
    }

    async getPaymentStatus(paymentId: string): Promise<{ status: string; raw: any }> {
        try {
            const response = await this.payment.get({ id: paymentId })
            return {
                status: this.mapStatus(response.status || 'pending'),
                raw: response,
            }
        } catch (error: any) {
            console.error('[MERCADOPAGO] Erro ao buscar status:', error)
            throw new Error('Erro ao consultar status do pagamento')
        }
    }

    private mapStatus(mpStatus: string): string {
        const statusMap: Record<string, string> = {
            pending: 'PENDING',
            approved: 'APPROVED',
            authorized: 'APPROVED',
            in_process: 'PENDING',
            in_mediation: 'PENDING',
            rejected: 'REJECTED',
            cancelled: 'CANCELLED',
            refunded: 'REFUNDED',
            charged_back: 'CHARGED_BACK',
        }
        return statusMap[mpStatus] || 'PENDING'
    }

    private getExpirationDate(minutes: number): string {
        const date = new Date()
        date.setMinutes(date.getMinutes() + minutes)
        return date.toISOString()
    }
}
