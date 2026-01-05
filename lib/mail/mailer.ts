import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASS || 'pass',
    },
})

export async function sendEmail(to: string, subject: string, html: string) {
    // Modo Desenvolvimento sem SMTP configurado: Log apenas
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log(`
========== [DEV EMAIL MOCK] ==========
To: ${to}
Subject: ${subject}
HTML Length: ${html.length} chars
======================================
        `)
        return { success: true, message: 'Mock sent' }
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Checkout" <noreply@checkout.com>',
            to,
            subject,
            html,
        })
        console.log(`[MAIL] Email sent: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error('[MAIL] Error sending email:', error)
        return { success: false, error: error.message }
    }
}
