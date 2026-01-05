const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Buscando produto do seed...')
        // Usando checkout_hash que sabemos que está no seed.ts
        const produtos = await prisma.$queryRaw`SELECT * FROM produtos WHERE checkout_hash = 'produto-exemplo-123'`

        let produto = produtos[0]

        if (!produto) {
            console.log('Produto não encontrado. Pegando o primeiro produto disponível...')
            const all = await prisma.$queryRaw`SELECT * FROM produtos LIMIT 1`
            produto = all[0]
        }

        if (!produto) {
            console.log('Nenhum produto no banco. Rode o seed do sistema primeiro.')
            return
        }

        console.log('Produto alvo:', produto.nome)

        const email = 'aluno@teste.com'
        const vendaId = `venda-mock-${Date.now()}`

        // Criar venda
        console.log('Criando venda aprovada...')
        await prisma.$executeRaw`
            INSERT INTO vendas (id, produto_id, valor, status_pagamento, comprador_email, comprador_nome, data_venda)
            VALUES (
                ${vendaId}, 
                ${produto.id}, 
                297.00, 
                'approved', 
                ${email}, 
                'Aluno Teste', 
                NOW()
            )
        `

        // Criar acesso
        const acessoId = `access-${Date.now()}`
        const senhaHash = crypto.createHash('sha256').update('123456').digest('hex')

        console.log('Criando acesso...')
        // Deletar anterior se existir para limpar teste
        await prisma.$executeRaw`DELETE FROM alunos_acessos WHERE email_aluno = ${email} AND produto_id = ${produto.id}`

        await prisma.$executeRaw`
            INSERT INTO alunos_acessos (id, email_aluno, produto_id, senha, venda_id, data_acesso)
            VALUES (${acessoId}, ${email}, ${produto.id}, ${senhaHash}, ${vendaId}, NOW())
        `

        console.log('------------------------------------------------')
        console.log('SUCESSO!')
        console.log(`Login: ${email}`)
        console.log('Senha: 123456')
        console.log('------------------------------------------------')

    } catch (e) {
        console.error('Erro:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
