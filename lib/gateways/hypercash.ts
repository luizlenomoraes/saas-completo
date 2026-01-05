interface HypercashConfig {
    secretKey: string
    publicKey: string
}

export class HypercashGateway {
    private config: HypercashConfig
    private baseUrl = 'https://api.hypercash.com' // URL fictícia

    constructor(config: HypercashConfig) {
        this.config = config
    }

    async createPayment(input: any) {
        // Placeholder
        if (process.env.NODE_ENV === 'development') {
            return {
                paymentId: 'mock_hyper_' + Date.now(),
                status: 'pending',
                qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
                qrCodeBase64: '',
                copyPaste: '00020126330014BR.GOV.BCB.PIX0111HYPER',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }
        }
        throw new Error('Hypercash Gateway ainda não implementado (aguardando documentação/chaves)')
    }
}
