import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mail/mailer'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Buscar emails pendentes (limite de 50 por vez para não estourar tempo de execução)
        const pendingEmails: any[] = await prisma.$queryRaw`
            SELECT * FROM email_queue 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 50
        `

        if (pendingEmails.length === 0) {
            return NextResponse.json({ message: 'No pending emails' })
        }

        console.log(`[CRON_EMAIL] Processando ${pendingEmails.length} emails pendentes`)

        const results = {
            success: 0,
            failed: 0
        }

        for (const email of pendingEmails) {
            try {
                // Enviar email
                const result = await sendEmail(email.recipient_email, email.subject, email.body)

                // Atualizar status
                if (result.success) {
                    await prisma.$executeRaw`
                        UPDATE email_queue 
                        SET status = 'sent', sent_at = NOW() 
                        WHERE id = ${email.id}
                    `
                    results.success++
                } else {
                    // Contabilizar tentativas de falha se tiver campo retry (futuro) ou marcar failed
                    await prisma.$executeRaw`
                        UPDATE email_queue 
                        SET status = 'failed', error_message = ${result.error || 'Unknown error'}
                        WHERE id = ${email.id}
                    `
                    results.failed++
                }
            } catch (err: any) {
                console.error(`[CRON_EMAIL] Erro crítico ao processar email ${email.id}:`, err)
                await prisma.$executeRaw`
                        UPDATE email_queue 
                        SET status = 'failed', error_message = ${err.message}
                        WHERE id = ${email.id}
                    `
                results.failed++
            }
        }

        return NextResponse.json({
            processed: pendingEmails.length,
            results
        })

    } catch (error: any) {
        console.error('[CRON_EMAIL] Falha geral:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
