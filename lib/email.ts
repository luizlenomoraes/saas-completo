import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'

// Tipos
interface EmailOptions {
    to: string
    subject: string
    html: string
    attachments?: Array<{
        filename: string
        path: string
    }>
}

interface DeliveryEmailData {
    customerName: string
    customerEmail: string
    products: Array<{
        name: string
        type: 'link' | 'pdf' | 'area_membros' | 'produto_fisico'
        content?: string
    }>
    memberPassword?: string
    loginUrl?: string
    setupToken?: string
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

/**
 * Cria o transporter do nodemailer com as configs do banco
 */
async function createTransporter() {
    // Buscar configurações SMTP do banco
    const configs = await prisma.config.findMany({
        where: {
            key: {
                in: [
                    'smtp_host',
                    'smtp_port',
                    'smtp_username',
                    'smtp_password',
                    'smtp_encryption',
                    'smtp_from_email',
                    'smtp_from_name',
                ],
            },
        },
    })

    const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))

    // Se não houver config SMTP, usar env vars
    const host = configMap.smtp_host || process.env.SMTP_HOST
    const port = parseInt(configMap.smtp_port || process.env.SMTP_PORT || '465')
    const user = configMap.smtp_username || process.env.SMTP_USER
    const pass = configMap.smtp_password || process.env.SMTP_PASS
    const encryption = configMap.smtp_encryption || 'ssl'

    if (!host || !user || !pass) {
        throw new Error('Configurações SMTP não encontradas')
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: encryption === 'ssl',
        auth: {
            user,
            pass,
        },
        tls: {
            // Em produção, manter verificação de SSL
            rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
    })
}

/**
 * Envia email usando as configurações SMTP do banco
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const transporter = await createTransporter()

        // Buscar nome e email do remetente
        const configs = await prisma.config.findMany({
            where: {
                key: {
                    in: ['smtp_from_email', 'smtp_from_name', 'smtp_username'],
                },
            },
        })

        const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
        const fromEmail = configMap.smtp_from_email || configMap.smtp_username || process.env.SMTP_FROM_EMAIL
        const fromName = configMap.smtp_from_name || process.env.SMTP_FROM_NAME || 'Checkout Platform'

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            attachments: options.attachments,
        })

        console.log(`[EMAIL] Enviado para ${options.to}: ${options.subject}`)
        return true
    } catch (error) {
        console.error('[EMAIL] Erro ao enviar:', error)
        return false
    }
}

/**
 * Envia email de entrega de produto (equivalente ao send_delivery_email_consolidated do PHP)
 */
export async function sendDeliveryEmail(data: DeliveryEmailData): Promise<boolean> {
    try {
        // Buscar template do banco
        const templateConfig = await prisma.config.findFirst({
            where: { key: 'email_template_delivery_html' },
        })

        const subjectConfig = await prisma.config.findFirst({
            where: { key: 'email_template_delivery_subject' },
        })

        let template = templateConfig?.value || getDefaultDeliveryTemplate()
        const subject = subjectConfig?.value || 'Seu acesso chegou!'

        // Buscar logo da plataforma
        const logoConfig = await prisma.systemConfig.findFirst({
            where: { key: 'logo_url' },
        })

        const logoUrl = logoConfig?.value
            ? `${process.env.NEXT_PUBLIC_APP_URL}/${logoConfig.value}`
            : ''

        // Substituir variáveis
        template = template
            .replace(/{CLIENT_NAME}/g, data.customerName)
            .replace(/{CLIENT_EMAIL}/g, data.customerEmail)
            .replace(/{MEMBER_AREA_PASSWORD}/g, data.memberPassword || 'N/A')
            .replace(/{MEMBER_AREA_LOGIN_URL}/g, data.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL}/member/login`)
            .replace(/{LOGO_URL}/g, logoUrl)

        // URL de setup de senha
        if (data.setupToken) {
            const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/member/setup-password?token=${data.setupToken}`
            template = template.replace(/{SETUP_PASSWORD_URL}/g, setupUrl)
        }

        // Processar endereço
        if (data.address) {
            const addressHtml = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #333; font-size: 16px;">Endereço de Entrega</h3>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>CEP:</strong> ${data.address.cep}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Endereço:</strong> ${data.address.street}, ${data.address.number}${data.address.complement ? ' - ' + data.address.complement : ''}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Bairro:</strong> ${data.address.neighborhood}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Cidade/UF:</strong> ${data.address.city} - ${data.address.state}</p>
        </div>
      `
            template = template.replace(/{DELIVERY_ADDRESS}/g, addressHtml)
        } else {
            template = template.replace(/{DELIVERY_ADDRESS}/g, '')
        }

        // Processar loop de produtos
        const loopStart = '<!-- LOOP_PRODUCTS_START -->'
        const loopEnd = '<!-- LOOP_PRODUCTS_END -->'

        if (template.includes(loopStart)) {
            const startIdx = template.indexOf(loopStart) + loopStart.length
            const endIdx = template.indexOf(loopEnd)
            const productTemplate = template.substring(startIdx, endIdx)

            let productsHtml = ''
            for (const product of data.products) {
                let productItem = productTemplate
                    .replace(/{PRODUCT_NAME}/g, product.name)
                    .replace(/{PRODUCT_LINK}/g, product.type === 'link' ? product.content || '' : '')

                // Processar condicionais de tipo
                const types = ['link', 'pdf', 'area_membros', 'produto_fisico']
                for (const type of types) {
                    const tagName = `PRODUCT_TYPE_${type === 'area_membros' ? 'MEMBER_AREA' : type === 'produto_fisico' ? 'PHYSICAL_PRODUCT' : type.toUpperCase()}`
                    if (product.type === type) {
                        productItem = productItem
                            .replace(new RegExp(`<!-- IF_${tagName} -->`, 'g'), '')
                            .replace(new RegExp(`<!-- END_IF_${tagName} -->`, 'g'), '')
                    } else {
                        productItem = productItem.replace(
                            new RegExp(`<!-- IF_${tagName} -->.*?<!-- END_IF_${tagName} -->`, 'gs'),
                            ''
                        )
                    }
                }

                productsHtml += productItem
            }

            template = template.replace(loopStart + productTemplate + loopEnd, productsHtml)
        }

        // Coletar anexos (PDFs)
        const attachments = data.products
            .filter((p) => p.type === 'pdf' && p.content)
            .map((p) => ({
                filename: p.content!.split('/').pop() || 'arquivo.pdf',
                path: `${process.cwd()}/public/${p.content}`,
            }))

        return await sendEmail({
            to: data.customerEmail,
            subject,
            html: template,
            attachments,
        })
    } catch (error) {
        console.error('[EMAIL] Erro ao enviar email de entrega:', error)
        return false
    }
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #32e768 0%, #28c058 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #32e768; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperação de Senha</h1>
        </div>
        <div class="content">
          <p>Olá ${name || 'usuário'},</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
          </p>
          <p>Se você não solicitou esta alteração, ignore este email. O link expira em 1 hora.</p>
          <p>Por segurança, não compartilhe este link com ninguém.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

    return await sendEmail({
        to: email,
        subject: 'Recuperação de Senha',
        html,
    })
}

/**
 * Template padrão de email de entrega
 */
function getDefaultDeliveryTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #32e768 0%, #28c058 100%); padding: 30px; text-align: center; }
        .logo { max-height: 50px; margin-bottom: 10px; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .product-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #32e768; }
        .button { display: inline-block; background: #32e768; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="{LOGO_URL}" alt="Logo" class="logo">
          <h1>Seu acesso chegou! 🎉</h1>
        </div>
        <div class="content">
          <p>Olá <strong>{CLIENT_NAME}</strong>,</p>
          <p>Sua compra foi aprovada com sucesso! Aqui estão os detalhes do seu acesso:</p>
          
          <!-- LOOP_PRODUCTS_START -->
          <div class="product-card">
            <h3 style="margin: 0 0 10px 0; color: #333;">{PRODUCT_NAME}</h3>
            <!-- IF_PRODUCT_TYPE_LINK -->
            <p><a href="{PRODUCT_LINK}" class="button">Acessar Conteúdo</a></p>
            <!-- END_IF_PRODUCT_TYPE_LINK -->
            <!-- IF_PRODUCT_TYPE_MEMBER_AREA -->
            <p>Acesse a área de membros com seu email: <strong>{CLIENT_EMAIL}</strong></p>
            <!-- IF_NEW_USER_SETUP -->
            <p><a href="{SETUP_PASSWORD_URL}" class="button">Criar sua Senha</a></p>
            <!-- END_IF_NEW_USER_SETUP -->
            <!-- IF_EXISTING_USER -->
            <p><a href="{MEMBER_AREA_LOGIN_URL}" class="button">Acessar Área de Membros</a></p>
            <!-- END_IF_EXISTING_USER -->
            <!-- END_IF_PRODUCT_TYPE_MEMBER_AREA -->
            <!-- IF_PRODUCT_TYPE_PDF -->
            <p>O arquivo PDF está anexo a este email.</p>
            <!-- END_IF_PRODUCT_TYPE_PDF -->
            <!-- IF_PRODUCT_TYPE_PHYSICAL_PRODUCT -->
            <p>Seu produto físico será enviado para o endereço informado.</p>
            <!-- END_IF_PRODUCT_TYPE_PHYSICAL_PRODUCT -->
          </div>
          <!-- LOOP_PRODUCTS_END -->
          
          {DELIVERY_ADDRESS}
          
          <p style="margin-top: 30px;">Qualquer dúvida, entre em contato conosco.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Adiciona email à fila (para processamento em background)
 */
export async function queueEmail(options: EmailOptions): Promise<void> {
    await prisma.emailQueue.create({
        data: {
            recipientEmail: options.to,
            subject: options.subject,
            body: options.html,
            status: 'PENDING',
        },
    })
}

/**
 * Processa fila de emails (chamar via cron job)
 */
export async function processEmailQueue(): Promise<void> {
    const pendingEmails = await prisma.emailQueue.findMany({
        where: {
            status: 'PENDING',
            attempts: { lt: 3 },
        },
        take: 10,
    })

    for (const email of pendingEmails) {
        await prisma.emailQueue.update({
            where: { id: email.id },
            data: { status: 'PROCESSING' },
        })

        const success = await sendEmail({
            to: email.recipientEmail,
            subject: email.subject,
            html: email.body,
        })

        await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
                status: success ? 'SENT' : 'FAILED',
                attempts: { increment: 1 },
                sentAt: success ? new Date() : null,
                errorMessage: success ? null : 'Falha ao enviar',
            },
        })
    }
}
