import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { getWelcomeEmailTemplate } from '@/lib/mail/templates'

/**
 * Processa a atualização de status de uma venda vinda de um webhook
 */
export async function processSaleUpdate(venda: any, newStatus: string, paymentData: any, gateway: string) {
    if (newStatus === venda.status_pagamento) {
        return false
    }

    // Atualizar status da venda no banco
    await prisma.$executeRaw`
        UPDATE vendas 
        SET status_pagamento = ${newStatus}::sale_status
        WHERE id = ${venda.id}
    `
    console.log(`[SALES_SERVICE] Status da venda ${venda.id} atualizado para: ${newStatus} (via ${gateway})`)

    // Se aprovado, executar ações pós-pagamento (Member area, notificações, pixels)
    if (newStatus === 'approved') {
        await handleApprovedPayment(venda)
    }

    // Disparar webhooks configurados pelo vendedor e UTMfy
    await dispatchVendorWebhooks(venda, newStatus, paymentData)

    return true
}

/**
 * Executa ações quando o pagamento é aprovado
 */
async function handleApprovedPayment(venda: any) {
    try {
        console.log('[SALES_SERVICE] Processando pagamento aprovado:', venda.id)

        // 1. Marcar email de entrega como pendente (para ser enviado pelo worker/cron)
        // Se ainda não foi enviado
        await prisma.$executeRaw`
            UPDATE vendas 
            SET email_entrega_enviado = false
            WHERE id = ${venda.id} AND email_entrega_enviado = true -- Resetar se necessário ou manter false
            -- Na verdade, se a venda acabou de ser aprovada, o padrão é false ou null.
            -- Vamos garantir que seja setado para envio.
        `

        // 2. Se for área de membros, criar acesso
        let tempPassword = ''

        if (venda.tipo_entrega === 'area_membros') {
            // Verificar se já existe acesso
            const existingAccess: any[] = await prisma.$queryRaw`
                SELECT id FROM alunos_acessos 
                WHERE email_aluno = ${venda.comprador_email} 
                AND produto_id = ${venda.produto_id}
            `

            if (existingAccess.length === 0) {
                // Gerar senha temporária
                tempPassword = crypto.randomBytes(4).toString('hex')
                const hashedPassword = crypto.createHash('sha256').update(tempPassword).digest('hex')
                const acessoId = crypto.randomUUID()

                await prisma.$executeRaw`
                    INSERT INTO alunos_acessos (id, email_aluno, produto_id, senha, venda_id, data_acesso)
                    VALUES (
                        ${acessoId},
                        ${venda.comprador_email},
                        ${venda.produto_id},
                        ${hashedPassword},
                        ${venda.id},
                        NOW()
                    )
                `
                console.log('[SALES_SERVICE] Acesso à área de membros criado')
            }
        }

        // 3. Criar notificação interna para o vendedor (Dash)
        const notifId = crypto.randomUUID()
        await prisma.$executeRaw`
            INSERT INTO notificacoes (id, usuario_id, tipo, mensagem, venda_id_fk, data_notificacao)
            SELECT 
                ${notifId},
                p.usuario_id,
                'venda_aprovada',
                ${'Venda aprovada: ' + venda.produto_nome},
                ${venda.id},
                NOW()
            FROM produtos p
            WHERE p.id = ${venda.produto_id}
        `

        // 4. Adicionar email de boas-vindas à fila usando template
        const accessUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/login'
        const emailBody = getWelcomeEmailTemplate(
            venda.produto_nome,
            venda.comprador_nome || 'Cliente',
            accessUrl,
            venda.comprador_email,
            tempPassword || '(Use sua senha existente)'
        )

        const queueId = crypto.randomUUID()
        await prisma.$executeRaw`
            INSERT INTO email_queue (id, recipient_email, subject, body, status, created_at)
            VALUES (
                ${queueId},
                ${venda.comprador_email},
                ${'Acesso Liberado: ' + venda.produto_nome},
                ${emailBody},
                'pending',
                NOW()
            )
        `
        console.log('[SALES_SERVICE] Email adicionado à fila')

    } catch (error) {
        console.error('[SALES_SERVICE] Erro ao processar ações de aprovação:', error)
    }
}

/**
 * Dispara webhooks externos configurados pelo usuário
 */
async function dispatchVendorWebhooks(venda: any, status: string, paymentData: any) {
    try {
        // Mapear status db ('approved') para nome da coluna no db ('event_approved')
        // Assumindo que o banco tem colunas booleanas como event_approved, event_pending, etc.
        // Se a coluna for string/enum, a query seria diferente.
        // Baseado no código anterior do webhooks/mercadopago, as colunas existem.

        let eventColumn = ''
        switch (status) {
            case 'approved': eventColumn = 'event_approved'; break;
            case 'pending': eventColumn = 'event_pending'; break;
            case 'rejected': eventColumn = 'event_rejected'; break;
            case 'refunded': eventColumn = 'event_refunded'; break;
            case 'charged_back': eventColumn = 'event_charged_back'; break;
        }

        if (!eventColumn) return

        // Eu não deveria usar sql dinâmico para colunas, mas prisma raw exige cuidado.
        // Como eventColumn vem de um switch hardcoded, é seguro.

        // Porém, prisma.$queryRaw não aceita identifiers dinâmicos diretamente em template tags de forma fácil para colunas.
        // A melhor forma segura é filtrar no código ou usar Unsafe (com cuidado absurdo).
        // Vou buscar todos os webhooks do produto e filtrar no JS para ser 100% seguro e agnóstico de DB.

        const webhooks: any[] = await prisma.$queryRaw`
            SELECT url, event_approved, event_pending, event_rejected, event_refunded, event_charged_back
            FROM webhooks w
            WHERE w.produto_id = ${venda.produto_id} OR w.produto_id IS NULL
        `

        for (const webhook of webhooks) {
            const shouldFire =
                (status === 'approved' && webhook.event_approved) ||
                (status === 'pending' && webhook.event_pending) ||
                (status === 'rejected' && webhook.event_rejected) ||
                (status === 'refunded' && webhook.event_refunded) ||
                (status === 'charged_back' && webhook.event_charged_back)

            if (shouldFire) {
                try {
                    // Adicionar UTMs se disponível na venda (precisa buscar na query de venda antes)
                    // ... assumindo q venda tem os campos

                    const payload = {
                        event: status,
                        sale_id: venda.id,
                        product_id: venda.produto_id,
                        product_name: venda.produto_nome,
                        customer_email: venda.comprador_email,
                        customer_name: venda.comprador_nome,
                        customer_phone: venda.comprador_telefone,
                        payment_id: paymentData?.id || paymentData?.transactionId,
                        amount: venda.valor, // Valor da venda no DB
                        utm_source: venda.utm_source,
                        utm_medium: venda.utm_medium,
                        utm_campaign: venda.utm_campaign,
                        src: venda.src,
                        sck: venda.sck,
                        timestamp: new Date().toISOString(),
                    }

                    // Disparar
                    fetch(webhook.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    }).catch(err => console.error(`[SALES_SERVICE] Falha ao enviar para ${webhook.url}`, err))

                    console.log(`[SALES_SERVICE] Webhook disparado para ${webhook.url}`)
                } catch (err) {
                    console.error(`[SALES_SERVICE] Erro ao preparar webhook ${webhook.url}`, err)
                }
            }
        }
    } catch (error) {
        console.error('[SALES_SERVICE] Erro ao buscar webhooks:', error)
    }
}
