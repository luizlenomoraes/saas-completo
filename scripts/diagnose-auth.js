const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth(email, password) {
    console.log(`\nTestando login para: ${email} com senha: ${password}`)

    try {
        const user = await prisma.usuarios.findUnique({
            where: { usuario: email },
        })

        if (!user) {
            console.log('❌ Usuário não encontrado no banco de dados.')
            return
        }

        console.log('✅ Usuário encontrado:', user.id, user.tipo)
        console.log('   Hash no banco:', user.senha)

        const isValid = await bcrypt.compare(password, user.senha)

        if (isValid) {
            console.log('✅ Senha CORRETA! O bcrypt.compare retornou true.')
        } else {
            console.log('❌ Senha INCORRETA! O bcrypt.compare retornou false.')

            // Teste extra: gerar novo hash e comparar
            const newHash = await bcrypt.hash(password, 10)
            console.log('   Novo hash gerado para comparação visual:', newHash)
        }

    } catch (e) {
        console.error('❌ Erro no teste:', e)
    }
}

async function main() {
    console.log('--- DIAGNÓSTICO DE AUTENTICAÇÃO ---')
    await testAuth('admin@checkout.com', 'admin123')
    await testAuth('teste@infoprodutor.com', '123456')
    console.log('\n-----------------------------------')
    await prisma.$disconnect()
}

main()
