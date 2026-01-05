-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('admin', 'infoprodutor', 'usuario');

-- CreateEnum
CREATE TYPE "delivery_type" AS ENUM ('link', 'email_pdf', 'area_membros', 'produto_fisico');

-- CreateEnum
CREATE TYPE "sale_status" AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'charged_back', 'cancelled', 'info_filled', 'pix_created');

-- CreateEnum
CREATE TYPE "lesson_content_type" AS ENUM ('video', 'files', 'mixed');

-- CreateEnum
CREATE TYPE "saas_period" AS ENUM ('mensal', 'anual');

-- CreateEnum
CREATE TYPE "saas_subscription_status" AS ENUM ('ativo', 'expirado', 'cancelado', 'pendente');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('pending', 'processing', 'sent', 'failed');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "nome" TEXT,
    "telefone" TEXT,
    "senha" TEXT NOT NULL,
    "tipo" "user_type" NOT NULL DEFAULT 'infoprodutor',
    "foto_perfil" TEXT,
    "mp_public_key" TEXT,
    "mp_access_token" TEXT,
    "pushinpay_token" TEXT,
    "efi_client_id" TEXT,
    "efi_client_secret" TEXT,
    "efi_certificate_path" TEXT,
    "efi_pix_key" TEXT,
    "efi_payee_code" TEXT,
    "beehive_secret_key" TEXT,
    "beehive_public_key" TEXT,
    "hypercash_secret_key" TEXT,
    "hypercash_public_key" TEXT,
    "remember_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "password_setup_token" TEXT,
    "password_setup_expires" TIMESTAMP(3),
    "ultima_visualizacao_notificacoes" TIMESTAMP(3),
    "saas_plano_free_atribuido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "email" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "last_attempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "preco_anterior" DECIMAL(10,2),
    "foto" TEXT,
    "checkout_hash" TEXT NOT NULL,
    "checkout_config" JSONB,
    "tipo_entrega" "delivery_type" NOT NULL DEFAULT 'link',
    "conteudo_entrega" TEXT,
    "gateway" TEXT NOT NULL DEFAULT 'mercadopago',
    "usuario_id" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_bumps" (
    "id" TEXT NOT NULL,
    "main_product_id" TEXT NOT NULL,
    "offer_product_id" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'Sim, eu quero aproveitar essa oferta!',
    "description" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "order_bumps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_exclusive_offers" (
    "id" TEXT NOT NULL,
    "source_product_id" TEXT NOT NULL,
    "offer_product_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_exclusive_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status_pagamento" "sale_status" NOT NULL,
    "metodo_pagamento" TEXT,
    "transacao_id" TEXT,
    "checkout_session_uuid" TEXT,
    "comprador_email" TEXT NOT NULL,
    "comprador_nome" TEXT,
    "comprador_cpf" TEXT,
    "comprador_telefone" TEXT,
    "comprador_cep" TEXT,
    "comprador_logradouro" TEXT,
    "comprador_numero" TEXT,
    "comprador_complemento" TEXT,
    "comprador_bairro" TEXT,
    "comprador_cidade" TEXT,
    "comprador_estado" TEXT,
    "utm_source" TEXT,
    "utm_campaign" TEXT,
    "utm_medium" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "src" TEXT,
    "sck" TEXT,
    "email_entrega_enviado" BOOLEAN NOT NULL DEFAULT false,
    "email_recovery_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_reenviado_manual" BOOLEAN NOT NULL DEFAULT false,
    "data_venda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "valor" DECIMAL(10,2),
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "displayed_live" BOOLEAN NOT NULL DEFAULT false,
    "link_acao" TEXT,
    "metodo_pagamento" TEXT,
    "venda_id_fk" TEXT,
    "data_notificacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem_url" TEXT,
    "banner_url" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagem_capa_url" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "release_days" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL,
    "modulo_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url_video" TEXT,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "release_days" INTEGER NOT NULL DEFAULT 0,
    "tipo_conteudo" "lesson_content_type" NOT NULL DEFAULT 'video',

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aula_arquivos" (
    "id" TEXT NOT NULL,
    "aula_id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "nome_salvo" TEXT NOT NULL,
    "caminho_arquivo" TEXT NOT NULL,
    "tipo_mime" TEXT,
    "tamanho_bytes" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "data_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aula_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos_acessos" (
    "id" TEXT NOT NULL,
    "aluno_email" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "data_concessao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alunos_acessos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno_progresso" (
    "id" TEXT NOT NULL,
    "aluno_email" TEXT NOT NULL,
    "aula_id" TEXT NOT NULL,
    "data_conclusao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aluno_progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "url" VARCHAR(2048) NOT NULL,
    "event_approved" BOOLEAN NOT NULL DEFAULT false,
    "event_pending" BOOLEAN NOT NULL DEFAULT false,
    "event_rejected" BOOLEAN NOT NULL DEFAULT false,
    "event_refunded" BOOLEAN NOT NULL DEFAULT false,
    "event_charged_back" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utmfy_integrations" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "api_token" TEXT NOT NULL,
    "product_id" TEXT,
    "event_approved" BOOLEAN NOT NULL DEFAULT false,
    "event_pending" BOOLEAN NOT NULL DEFAULT false,
    "event_rejected" BOOLEAN NOT NULL DEFAULT false,
    "event_refunded" BOOLEAN NOT NULL DEFAULT false,
    "event_charged_back" BOOLEAN NOT NULL DEFAULT false,
    "event_initiate_checkout" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utmfy_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starfy_tracking_products" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "starfy_tracking_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starfy_tracking_events" (
    "id" TEXT NOT NULL,
    "tracking_product_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "starfy_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloned_sites" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "original_url" VARCHAR(2048) NOT NULL,
    "title" TEXT,
    "original_html" TEXT NOT NULL,
    "edited_html" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloned_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloned_site_settings" (
    "id" TEXT NOT NULL,
    "cloned_site_id" TEXT NOT NULL,
    "facebook_pixel_id" TEXT,
    "google_analytics_id" TEXT,
    "custom_head_scripts" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloned_site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_sistema" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "descricao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "pwa_config" (
    "id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL DEFAULT 'Plataforma',
    "short_name" TEXT NOT NULL DEFAULT 'App',
    "description" TEXT,
    "icon_path" TEXT,
    "theme_color" TEXT NOT NULL DEFAULT '#32e768',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "display_mode" TEXT NOT NULL DEFAULT 'standalone',
    "start_url" TEXT NOT NULL DEFAULT '/',
    "scope" TEXT NOT NULL DEFAULT '/',
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "vapid_public_key" TEXT,
    "vapid_private_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pwa_push_subscriptions" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pwa_push_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" VARCHAR(500),
    "icon" VARCHAR(500),
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pwa_push_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_config" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "periodo" "saas_period" NOT NULL DEFAULT 'mensal',
    "max_produtos" INTEGER,
    "max_pedidos_mes" INTEGER,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_assinaturas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "plano_id" TEXT NOT NULL,
    "status" "saas_subscription_status" NOT NULL DEFAULT 'pendente',
    "data_inicio" DATE NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "transacao_id" TEXT,
    "metodo_pagamento" TEXT,
    "gateway" TEXT,
    "renovacao_automatica" BOOLEAN NOT NULL DEFAULT true,
    "notificado_vencimento" BOOLEAN NOT NULL DEFAULT false,
    "notificado_expirado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_limites_uso" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "mes_ano" TEXT NOT NULL,
    "produtos_criados" INTEGER NOT NULL DEFAULT 0,
    "pedidos_realizados" INTEGER NOT NULL DEFAULT 0,
    "resetado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_limites_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_admin_gateways" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "mp_access_token" TEXT,
    "mp_public_key" TEXT,
    "efi_client_id" TEXT,
    "efi_client_secret" TEXT,
    "efi_certificate_path" TEXT,
    "efi_pix_key" TEXT,
    "efi_payee_code" TEXT,
    "pushinpay_token" TEXT,
    "beehive_secret_key" TEXT,
    "beehive_public_key" TEXT,
    "hypercash_secret_key" TEXT,
    "hypercash_public_key" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_admin_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_config_admin" (
    "id" TEXT NOT NULL,
    "mp_access_token" TEXT,
    "mp_public_key" TEXT,
    "pushinpay_token" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "payment_methods" JSONB,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_config_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugins" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "pasta" TEXT NOT NULL,
    "versao" TEXT NOT NULL DEFAULT '1.0.0',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "instalado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "email_status" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_checkout_hash_key" ON "produtos"("checkout_hash");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_produto_id_key" ON "cursos"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_acessos_aluno_email_produto_id_key" ON "alunos_acessos"("aluno_email", "produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_progresso_aluno_email_aula_id_key" ON "aluno_progresso"("aluno_email", "aula_id");

-- CreateIndex
CREATE UNIQUE INDEX "starfy_tracking_products_produto_id_key" ON "starfy_tracking_products"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "starfy_tracking_products_tracking_id_key" ON "starfy_tracking_products"("tracking_id");

-- CreateIndex
CREATE UNIQUE INDEX "cloned_site_settings_cloned_site_id_key" ON "cloned_site_settings"("cloned_site_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_sistema_chave_key" ON "configuracoes_sistema"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "saas_limites_uso_usuario_id_mes_ano_key" ON "saas_limites_uso"("usuario_id", "mes_ano");

-- CreateIndex
CREATE UNIQUE INDEX "saas_admin_gateways_gateway_key" ON "saas_admin_gateways"("gateway");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bumps" ADD CONSTRAINT "order_bumps_main_product_id_fkey" FOREIGN KEY ("main_product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bumps" ADD CONSTRAINT "order_bumps_offer_product_id_fkey" FOREIGN KEY ("offer_product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_exclusive_offers" ADD CONSTRAINT "product_exclusive_offers_source_product_id_fkey" FOREIGN KEY ("source_product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_exclusive_offers" ADD CONSTRAINT "product_exclusive_offers_offer_product_id_fkey" FOREIGN KEY ("offer_product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_venda_id_fk_fkey" FOREIGN KEY ("venda_id_fk") REFERENCES "vendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula_arquivos" ADD CONSTRAINT "aula_arquivos_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_acessos" ADD CONSTRAINT "alunos_acessos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_progresso" ADD CONSTRAINT "aluno_progresso_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utmfy_integrations" ADD CONSTRAINT "utmfy_integrations_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utmfy_integrations" ADD CONSTRAINT "utmfy_integrations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starfy_tracking_products" ADD CONSTRAINT "starfy_tracking_products_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starfy_tracking_products" ADD CONSTRAINT "starfy_tracking_products_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starfy_tracking_events" ADD CONSTRAINT "starfy_tracking_events_tracking_product_id_fkey" FOREIGN KEY ("tracking_product_id") REFERENCES "starfy_tracking_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloned_sites" ADD CONSTRAINT "cloned_sites_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloned_site_settings" ADD CONSTRAINT "cloned_site_settings_cloned_site_id_fkey" FOREIGN KEY ("cloned_site_id") REFERENCES "cloned_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pwa_push_subscriptions" ADD CONSTRAINT "pwa_push_subscriptions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_assinaturas" ADD CONSTRAINT "saas_assinaturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_assinaturas" ADD CONSTRAINT "saas_assinaturas_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "saas_planos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_limites_uso" ADD CONSTRAINT "saas_limites_uso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
