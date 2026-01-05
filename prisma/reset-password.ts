const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.log('Uso: npx tsx prisma/reset-password.ts <email>')
        // Se não passar, pega o primeiro da tabela
        const access = await prisma.alunos_acessos.findFirst()
        if (access) {
            console.log('Resetando senha para o primeiro aluno encontrado:', access.email_aluno)
            await reset(access.email_aluno)
        } else {
            console.log('Nenhum aluno encontrado.')
        }
        return
    }
    await reset(email)
}

async function reset(email) {
    const password = '123456'
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

    const result = await prisma.alunos_acessos.updateMany({
        where: { email_aluno: email },
        data: { senha: hashedPassword }
    })

    console.log(`Senha resetada para 123456 para o email ${email}. Registros afetados: ${result.count}`)
}

main()
