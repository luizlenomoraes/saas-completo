interface BeehiveConfig {
    apiToken: string
}

export class BeehiveGateway {
    private config: BeehiveConfig
    private baseUrl = 'https://api.beehive.com/v1' // URL fictícia, ajustar quando tiver doc

    constructor(config: BeehiveConfig) {
        this.config = config
    }

    async createPayment(input: any) {
        // Placeholder
        if (process.env.NODE_ENV === 'development') {
            return {
                paymentId: 'mock_beehive_' + Date.now(),
                status: 'pending',
                qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
                qrCodeBase64: '',
                copyPaste: '00020126330014BR.GOV.BCB.PIX0111BEEHIVE',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }
        }
        throw new Error('Beehive Gateway ainda não implementado (aguardando documentação/chaves)')
    }
}
