interface PushinPayPaymentInput {
    amount: number
    paymentMethod: 'pix'
    customer: {
        email: string
        name: string
        cpf: string
    }
    externalReference: string
}

interface PushinPayPaymentResult {
    paymentId: string
    status: string
    qrCode: string
    qrCodeBase64: string
    copyPaste: string
    expiresAt: string
}

export class PushinPayGateway {
    private token: string
    private baseUrl = 'https://api.pushinpay.com.br/api'

    constructor(token: string) {
        this.token = token
    }

    async createPayment(input: PushinPayPaymentInput): Promise<PushinPayPaymentResult> {
        if (input.paymentMethod !== 'pix') {
            throw new Error('PushinPay suporta apenas Pix no momento')
        }

        try {
            const payload = {
                value: Math.round(input.amount * 100), // converter para centavos
                webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pushinpay`,
                external_reference: input.externalReference,
                payer: {
                    name: input.customer.name,
                    document: input.customer.cpf.replace(/\D/g, ''),
                    email: input.customer.email
                }
            }

            const response = await fetch(`${this.baseUrl}/pix/cashIn`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                // Simular sucesso se for ambiente de teste e não tiver credencial válida
                if (process.env.NODE_ENV === 'development' && this.token === 'TEST_TOKEN') {
                    console.warn('[PUSHINPAY] Usando mock de teste devido a credenciais inválidas')
                    return {
                        paymentId: 'mock_tx_' + Date.now(),
                        status: 'pending',
                        qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
                        qrCodeBase64: '',
                        copyPaste: '00020126330014BR.GOV.BCB.PIX0111test@test.com5204000053039865802BR5913Leonardo Teste6008Brasilia62070503***6304E2CA',
                        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
                    }
                }
                throw new Error(data.message || 'Erro ao criar Pix na PushinPay')
            }

            return {
                paymentId: data.id,
                status: 'pending',
                qrCode: data.qr_code_url || '',
                qrCodeBase64: data.qr_code_base64 || '',
                copyPaste: data.qr_code || '',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }

        } catch (error: any) {
            console.error('[PUSHINPAY] Erro:', error)
            throw new Error(error.message || 'Erro de comunicação com PushinPay')
        }
    }
}
