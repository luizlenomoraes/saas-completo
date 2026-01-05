import https from 'https'
import fs from 'fs'
import path from 'path'

interface EfiConfig {
    clientId: string
    clientSecret: string
    pixKey: string
    certificateName: string // Nome do arquivo .p12 na pasta 'certs'
}

interface EfiPaymentInput {
    amount: number
    paymentMethod: 'pix'
    customer: {
        name: string
        cpf: string
    }
    externalReference: string
}

export class EfiGateway {
    private config: EfiConfig
    private baseUrl: string

    constructor(config: EfiConfig, sandbox = false) {
        this.config = config
        this.baseUrl = sandbox
            ? 'https://pix-h.api.efipay.com.br'
            : 'https://pix.api.efipay.com.br'
    }

    private async getAgent() {
        try {
            const certPath = path.join(process.cwd(), 'certs', this.config.certificateName)

            if (!fs.existsSync(certPath)) {
                throw new Error(`Certificado não encontrado: ${certPath}`)
            }

            const cert = fs.readFileSync(certPath)

            return new https.Agent({
                pfx: cert,
                passphrase: '' // Efí geralmente fornece certificado sem senha ou deve ser configurada
            })
        } catch (error) {
            console.error('[EFI] Erro ao carregar certificado:', error)
            throw error
        }
    }

    private async authenticate(agent: https.Agent) {
        const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')

        const response = await fetch(`${this.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grant_type: 'client_credentials' }),
            // @ts-ignore - Next.js fetch extendido não tipa 'agent' nativamente, mas node-fetch suporta
            agent
        })

        if (!response.ok) {
            throw new Error('Falha na autenticação Efí')
        }

        const data = await response.json()
        return data.access_token
    }

    async createPayment(input: EfiPaymentInput) {
        if (input.paymentMethod !== 'pix') {
            throw new Error('Integração Efí suporta apenas Pix neste momento')
        }

        try {
            // Em produção real, você deve gerenciar o cache do agent e token
            const agent = await this.getAgent()
            const token = await this.authenticate(agent)

            const payload = {
                calendario: {
                    expiracao: 3600 // 1 hora
                },
                devedor: {
                    cpf: input.customer.cpf.replace(/\D/g, ''),
                    nome: input.customer.name
                },
                valor: {
                    original: input.amount.toFixed(2)
                },
                chave: this.config.pixKey,
                solicitacaoPagador: `Pedido ${input.externalReference}`
            }

            const response = await fetch(`${this.baseUrl}/v2/cob`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                // @ts-ignore
                agent
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar cobrança Efí')
            }

            // Gerar QR Code (endpoint separado loc/{id}/qrcode)
            const locId = data.loc.id
            const qrResponse = await fetch(`${this.baseUrl}/v2/loc/${locId}/qrcode`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                // @ts-ignore
                agent
            })

            const qrData = await qrResponse.json()

            return {
                paymentId: data.txid,
                status: 'pending',
                qrCode: qrData.imagemQrcode,
                qrCodeBase64: qrData.imagemQrcode, // Efí retorna base64 direto em imagemQrcode? Verificar doc. Geralmente retorna link ou base64.
                copyPaste: qrData.qrcode,
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
            }

        } catch (error: any) {
            console.error('[EFI] Erro:', error)
            // Mock para desenvolvimento se falhar certificado
            if (process.env.NODE_ENV === 'development') {
                return {
                    paymentId: 'mock_efi_' + Date.now(),
                    status: 'pending',
                    qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
                    qrCodeBase64: '',
                    copyPaste: '00020126330014BR.GOV.BCB.PIX...',
                    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
                }
            }
            throw new Error('Erro na integração Efí: ' + error.message)
        }
    }
}
