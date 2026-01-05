import { prisma } from "@/lib/db"

export interface LimitCheckResult {
    allowed: boolean
    reason?: string
    limit?: number
    current?: number
}

// Verifica limite de produtos
export async function checkSaaSProductLimit(userId: string): Promise<LimitCheckResult> {
    // 1. Verificar se SaaS está ativo globalmente
    const config = await prisma.saas_config.findUnique({ where: { id: 'saas-main-config' } })
    // Se SaaS inativo ou não configurado, assume ilimitado (comportamento legado)
    if (!config?.enabled) return { allowed: true }

    // 2. Buscar Assinatura Ativa
    const sub = await prisma.saas_assinaturas.findFirst({
        where: {
            usuario_id: userId,
            status: 'ativo'
        },
        include: { saas_planos: true },
        orderBy: { data_inicio: 'desc' }
    })

    if (!sub) {
        // Fallback: Verificar se o usuário tem flag de 'free atribuido' mas sem assinatura ativa (caso de erro)
        // Ou simplesmente bloquear.
        return { allowed: false, reason: 'Você não possui uma assinatura ativa para criar produtos.' }
    }

    const maxProdutos = sub.saas_planos.max_produtos

    // Se nulo ou 0, é ilimitado
    if (maxProdutos === null || maxProdutos === 0) return { allowed: true }

    // 3. Contar uso atual
    const count = await prisma.produtos.count({
        where: { usuario_id: userId }
    })

    if (count >= maxProdutos) {
        return {
            allowed: false,
            reason: `Limite de produtos atingido (${count}/${maxProdutos}). Faça upgrade do seu plano para criar mais.`,
            limit: maxProdutos,
            current: count
        }
    }

    return { allowed: true, limit: maxProdutos, current: count }
}

// Verifica limite de vendas (mensal)
export async function checkSaaSSalesLimit(userId: string): Promise<LimitCheckResult> {
    // 1. Verificar config global
    const config = await prisma.saas_config.findUnique({ where: { id: 'saas-main-config' } })
    if (!config?.enabled) return { allowed: true }

    // 2. Buscar assinatura
    const sub = await prisma.saas_assinaturas.findFirst({
        where: {
            usuario_id: userId,
            status: 'ativo'
        },
        include: { saas_planos: true },
        orderBy: { data_inicio: 'desc' }
    })

    if (!sub) return { allowed: false, reason: 'Produtor sem assinatura ativa.' }

    const maxVendas = sub.saas_planos.max_pedidos_mes

    if (maxVendas === null || maxVendas === 0) return { allowed: true }

    // 3. Contar vendas do mês atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const count = await prisma.vendas.count({
        where: {
            produtos: { usuario_id: userId }, // Vendas dos produtos deste usuário
            status_pagamento: 'approved', // Apenas aprovadas contam? Ou todas? Geralmente aprovadas.
            data_venda: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        }
    })

    if (count >= maxVendas) {
        return {
            allowed: false,
            reason: `O produtor atingiu o limite de vendas mensal (${count}/${maxVendas}).`,
            limit: maxVendas,
            current: count
        }
    }

    return { allowed: true, limit: maxVendas, current: count }
}
