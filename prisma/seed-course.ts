const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const venda = await prisma.vendas.findFirst({
            include: { produtos: true }
        })

        if (!venda) {
            console.log('Nenhuma venda encontrada para associar um curso.')
            return
        }

        const produtoId = venda.produto_id
        console.log(`Encontrada venda para produto ${produtoId} (${venda.produtos.nome})`)
        console.log(`Email do aluno: ${venda.comprador_email}`)

        // Verifica se já existe curso
        const existingCurso = await prisma.cursos.findFirst({
            where: { produto_id: produtoId }
        })

        if (existingCurso) {
            console.log('Curso já existe para este produto.')
            return
        }

        // Criar Curso
        const cursoId = `curso-${Date.now()}`
        const curso = await prisma.cursos.create({
            data: {
                id: cursoId,
                produto_id: produtoId,
                titulo: `Curso Completo de ${venda.produtos.nome}`,
                descricao: 'Aprenda tudo do zero ao avançado neste curso prático.',
                imagem_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
            }
        })
        console.log('Curso criado:', curso.titulo)

        // Criar Módulos e Aulas
        const modulos = [
            { titulo: 'Módulo 01: Boas Vindas', aulas: ['Aula 1: Introdução', 'Aula 2: Como estudar', 'Aula 3: Suporte'] },
            { titulo: 'Módulo 02: Fundamentos', aulas: ['Aula 4: Conceitos Básicos', 'Aula 5: Ferramentas', 'Aula 6: Prática Inicial'] },
            { titulo: 'Módulo 03: Avançado', aulas: ['Aula 7: Técnicas Avançadas', 'Aula 8: Projeto Final', 'Aula 9: Certificado'] }
        ]

        let modOrdem = 1
        for (const mod of modulos) {
            const modId = `mod-${Date.now()}-${modOrdem}`
            const modulo = await prisma.modulos.create({
                data: {
                    id: modId,
                    curso_id: curso.id,
                    titulo: mod.titulo,
                    ordem: modOrdem++
                }
            })

            let aulaOrdem = 1
            for (const aulaTitulo of mod.aulas) {
                await prisma.aulas.create({
                    data: {
                        id: `aula-${Date.now()}-${modOrdem}-${aulaOrdem}`,
                        modulo_id: modulo.id,
                        titulo: aulaTitulo,
                        url_video: 'https://www.youtube.com/embed/BadB1z-V_qU', // Vídeo de exemplo (natureza)
                        descricao: 'Nesta aula você vai aprender conceitos importantes sobre o tema.',
                        ordem: aulaOrdem++
                    }
                })
            }
        }

        console.log('Curso populado com sucesso!')

        // Verificar senha do aluno em alunos_acessos
        // Se a senha for hash, nao consigo recuperar, mas posso resetar se quiser
        // Vou apenas informar que o aluno deve ter uma senha. 
        // Se foi criado via webhook mockado, a senha hash deve ser conhecida (ex: 123456 hash).

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
