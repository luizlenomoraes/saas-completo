import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...')

    // =============================================
    // 1. CRIAR USUÁRIO ADMIN (usuario = email)
    // =============================================
    const adminPassword = await bcrypt.hash('admin123', 10)
    const adminId = uuidv4()

    // Usar o delegate correto do Prisma Client
    const admin = await prisma.$executeRaw`
        INSERT INTO usuarios (id, usuario, nome, senha, tipo, "updatedAt")
        VALUES (${adminId}, ${'admin@checkout.com'}, ${'Administrador'}, ${adminPassword}, 'admin', NOW())
        ON CONFLICT (usuario) DO NOTHING
    `
    console.log('✅ Usuário admin processado')

    // =============================================
    // 2. CRIAR USUÁRIO INFOPRODUTOR DE TESTE
    // =============================================
    const infoprodutorPassword = await bcrypt.hash('123456', 10)
    const infoprodutorId = uuidv4()

    // Primeiro, tentar atualizar se já existir
    const updateResult = await prisma.$executeRaw`
        UPDATE usuarios 
        SET mp_public_key = ${'APP_USR-63ddfa41-456b-44eb-99b9-097439d7450c'},
            mp_access_token = ${'APP_USR-89444188142004-123017-0dcdc179a32c6b37830b05149d135a4a-4634228'}
        WHERE usuario = ${'teste@infoprodutor.com'}
    `

    if (updateResult === 0) {
        await prisma.$executeRaw`
            INSERT INTO usuarios (id, usuario, nome, senha, tipo, mp_public_key, mp_access_token, "updatedAt")
            VALUES (
                ${infoprodutorId}, 
                ${'teste@infoprodutor.com'}, 
                ${'Infoprodutor Teste'}, 
                ${infoprodutorPassword}, 
                'infoprodutor',
                ${'APP_USR-63ddfa41-456b-44eb-99b9-097439d7450c'},
                ${'APP_USR-89444188142004-123017-0dcdc179a32c6b37830b05149d135a4a-4634228'},
                NOW()
            )
        `
    }
    console.log('✅ Usuário infoprodutor processado')

    // Buscar o infoprodutor para usar o ID
    const infoprodutorRow: any[] = await prisma.$queryRaw`
        SELECT id FROM usuarios WHERE usuario = ${'teste@infoprodutor.com'}
    `
    const realInfoprodutorId = infoprodutorRow[0]?.id || infoprodutorId

    // =============================================
    // 3. CONFIGURAÇÃO PWA
    // =============================================
    await prisma.$executeRaw`
        INSERT INTO pwa_config (id, app_name, short_name, description, theme_color, background_color, display_mode, start_url, scope, push_enabled, updated_at)
        VALUES (
            ${'default-pwa-config'}, 
            ${'Checkout Platform'}, 
            ${'Checkout'},
            ${'Plataforma de checkout para produtos digitais'},
            ${'#32e768'},
            ${'#07090d'},
            ${'standalone'},
            ${'/'},
            ${'/'},
            ${false},
            NOW()
        )
        ON CONFLICT (id) DO NOTHING
    `
    console.log('✅ Configuração PWA processada')

    // =============================================
    // 4. CONFIGURAÇÃO SAAS (desabilitado por padrão)
    // =============================================
    await prisma.$executeRaw`
        INSERT INTO saas_config (id, enabled, updated_at)
        VALUES (${'default-saas-config'}, ${false}, NOW())
        ON CONFLICT (id) DO NOTHING
    `
    console.log('✅ Configuração SaaS processada')

    // =============================================
    // 5. PRODUTO DE EXEMPLO
    // =============================================
    const produtoId = uuidv4()
    const checkoutConfig = JSON.stringify({
        primaryColor: '#32e768',
        showTimer: true,
        timerMinutes: 15,
        showFakeNotifications: true,
        showBanner: false,
        bannerImages: [],
        youtubeVideoId: null,
        backRedirect: true,
        backRedirectMessage: 'Espere! Temos uma oferta especial para você!',
    })

    // Verificar se produto já existe
    const existingProduct: any[] = await prisma.$queryRaw`
        SELECT id FROM produtos WHERE checkout_hash = ${'produto-exemplo-123'}
    `

    let realProdutoId = existingProduct[0]?.id

    if (!realProdutoId) {
        await prisma.$executeRaw`
            INSERT INTO produtos (id, nome, descricao, preco, preco_anterior, checkout_hash, tipo_entrega, gateway, usuario_id, checkout_config)
            VALUES (
                ${produtoId}, 
                ${'Curso de Marketing Digital'}, 
                ${'Aprenda as melhores estratégias de marketing digital para alavancar seu negócio online.'},
                ${297.00},
                ${497.00},
                ${'produto-exemplo-123'},
                'area_membros',
                ${'mercadopago'},
                ${realInfoprodutorId},
                ${checkoutConfig}::jsonb
            )
        `
        realProdutoId = produtoId
        console.log('✅ Produto de exemplo criado')
    } else {
        console.log('⏩ Produto já existe')
    }

    // =============================================
    // 6. CURSO DE EXEMPLO (apenas se produto foi criado)
    // =============================================
    const existingCurso: any[] = await prisma.$queryRaw`
        SELECT id FROM cursos WHERE produto_id = ${realProdutoId}
    `

    if (existingCurso.length === 0) {
        const cursoId = uuidv4()

        await prisma.$executeRaw`
            INSERT INTO cursos (id, produto_id, titulo, descricao)
            VALUES (
                ${cursoId}, 
                ${realProdutoId}, 
                ${'Curso de Marketing Digital'},
                ${'Domine as estratégias de marketing digital e transforme seu negócio.'}
            )
        `

        // Criar módulos
        const modulo1Id = uuidv4()
        const modulo2Id = uuidv4()

        await prisma.$executeRaw`
            INSERT INTO modulos (id, curso_id, titulo, ordem, release_days)
            VALUES 
                (${modulo1Id}, ${cursoId}, ${'Módulo 1 - Introdução'}, ${0}, ${0}),
                (${modulo2Id}, ${cursoId}, ${'Módulo 2 - Fundamentos'}, ${1}, ${7})
        `

        // Criar aulas
        await prisma.$executeRaw`
            INSERT INTO aulas (id, modulo_id, titulo, url_video, descricao, ordem, release_days)
            VALUES 
                (${uuidv4()}, ${modulo1Id}, ${'Bem-vindo ao curso'}, ${'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}, ${'Nesta aula, você vai conhecer o curso.'}, ${0}, ${0}),
                (${uuidv4()}, ${modulo1Id}, ${'Como funciona a área de membros'}, ${'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}, ${'Aprenda a navegar pela plataforma.'}, ${1}, ${0}),
                (${uuidv4()}, ${modulo2Id}, ${'O que é Marketing Digital'}, ${'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}, ${'Entenda os conceitos básicos.'}, ${0}, ${0})
        `

        console.log('✅ Curso de exemplo criado com módulos e aulas')
    } else {
        console.log('⏩ Curso já existe')
    }

    console.log('')
    console.log('🎉 Seed concluído com sucesso!')
    console.log('')
    console.log('📋 Credenciais de acesso:')
    console.log('   Admin: admin@checkout.com / admin123')
    console.log('   Infoprodutor: teste@infoprodutor.com / 123456')
    console.log('')
    console.log('🔗 Checkout de exemplo: http://localhost:3000/checkout/produto-exemplo-123')
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
