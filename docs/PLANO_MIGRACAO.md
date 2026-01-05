# 📋 PLANO DE MIGRAÇÃO COMPLETO: PHP → Next.js

## 🎯 Objetivo
Migrar a plataforma de checkout/vendas de PHP para Next.js 14+, preservando **100% das funcionalidades** existentes.

---

## 📊 INVENTÁRIO COMPLETO DE FUNCIONALIDADES

### 🔐 Autenticação e Usuários
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Login com sessão | `login.php` | 🔴 Crítica |
| Registro de infoprodutor | `register.php` | 🔴 Crítica |
| Recuperação de senha | `forgot_password.php` | 🟡 Alta |
| Reset de senha | `reset_password.php` | 🟡 Alta |
| "Lembrar-me" (cookies/tokens) | `login.php`, `config.php` | 🟡 Alta |
| Logout | `logout.php` | 🔴 Crítica |
| Setup de senha (novos membros) | `member_setup_password.php` | 🟡 Alta |
| Perfil do usuário | `views/profile.php` | 🟢 Média |
| Foto de perfil | `api/api.php` | 🟢 Média |
| Multi-tipo de usuário (admin/infoprodutor/usuario) | Schema `usuarios` | 🔴 Crítica |

### 💳 Checkout e Pagamentos
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Página de checkout dinâmica | `checkout.php` | 🔴 Crítica |
| Mercado Pago (Pix/Cartão/Boleto) | `gateways/mercadopago.php` | 🔴 Crítica |
| PushinPay (Pix) | `gateways/pushinpay.php` | 🔴 Crítica |
| Efí/Gerencianet (Pix/Cartão) | `gateways/efi.php` | 🔴 Crítica |
| Beehive (Cartão) | `gateways/beehive.php` | 🔴 Crítica |
| Hypercash (Cartão) | `gateways/hypercash.php` | 🔴 Crítica |
| Order Bumps | `checkout.php` | 🔴 Crítica |
| Timer de urgência | `checkout.php` | 🟡 Alta |
| Notificações de vendas fake | `checkout.php` | 🟢 Média |
| Back redirect | `checkout.php` | 🟢 Média |
| Banners/Vídeo YouTube | `checkout.php` | 🟢 Média |
| Processamento de pagamento | `process_payment.php` | 🔴 Crítica |
| Página de obrigado | `obrigado.php` | 🔴 Crítica |
| Verificação de status (polling) | `check_status.php` | 🔴 Crítica |
| Modal Pix QR Code | `checkout.php` | 🔴 Crítica |

### 🔔 Webhooks e Notificações
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Webhook Mercado Pago | `api/notification.php` | 🔴 Crítica |
| Webhook PushinPay | `api/pushinpay_webhook.php` | 🔴 Crítica |
| Webhook Efí | `api/efi_webhook.php` | 🔴 Crítica |
| Webhook Beehive | `api/beehive_webhook.php` | 🔴 Crítica |
| Webhook Hypercash | `api/hypercash_webhook.php` | 🔴 Crítica |
| Notificações internas (live) | `api/notifications_api.php` | 🟡 Alta |
| Webhooks customizados (disparo) | `api/notification.php` | 🟡 Alta |
| Integração UTMfy | `helpers/utmfy_helper.php` | 🟢 Média |

### 📧 Emails
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Email de entrega de produto | `api/notification.php` | 🔴 Crítica |
| Reenvio de email de acesso | `api/api.php` | 🟡 Alta |
| Recuperação de carrinho | `email_recovery.php` | 🟢 Média |
| Broadcast/Email Marketing | `admin_broadcast.php` | 🟢 Média |
| Configuração SMTP | `views/admin/admin_smtp_config.php` | 🟡 Alta |
| Template de email customizável | `configuracoes` table | 🟡 Alta |

### 📊 Dashboard e Relatórios
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Dashboard com KPIs | `views/dashboard.php` | 🔴 Crítica |
| Gráfico de vendas (7/30 dias) | `api/api.php` | 🔴 Crítica |
| Tabela de vendas recentes | `views/vendas.php` | 🔴 Crítica |
| Filtros de vendas | `api/api.php` | 🟡 Alta |
| Exportação de relatórios | - | 🟢 Média |

### 📦 Gestão de Produtos
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Listagem de produtos | `views/produtos.php` | 🔴 Crítica |
| Criar/editar produto | `views/produto_config.php` | 🔴 Crítica |
| Editor de checkout visual | `views/checkout_editor.php` | 🟡 Alta |
| Preview de checkout | `views/checkout_editor_preview.php` | 🟡 Alta |
| Upload de imagem | `api/api.php` | 🔴 Crítica |
| Configurar order bumps | `views/produto_config/` | 🟡 Alta |
| Tipos de entrega (link/pdf/área) | Schema `produtos` | 🔴 Crítica |

### 🎓 Área de Membros
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Login de aluno | `member_login.php` | 🔴 Crítica |
| Dashboard do aluno | `member_area_dashboard.php` | 🔴 Crítica |
| Listagem de cursos | `member_area_cursos.php` | 🔴 Crítica |
| Player de aulas | `member_area_aula.php` | 🔴 Crítica |
| Progresso de aulas | Schema `aluno_progresso` | 🟡 Alta |
| Liberação por tempo (release days) | Schema `modulos`, `aulas` | 🟡 Alta |
| Download de arquivos | `aula_arquivos` table | 🟡 Alta |
| Gerenciador de cursos (infoprodutor) | `views/gerenciar_curso.php` | 🔴 Crítica |
| Gerenciador de alunos | `views/alunos.php` | 🟡 Alta |
| Ofertas exclusivas p/ membros | `views/infoprodutor_member_offers.php` | 🟢 Média |

### 👑 Painel Admin
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Dashboard admin | `views/admin/admin_dashboard.php` | 🔴 Crítica |
| Gerenciar usuários | `views/admin/admin_usuarios.php` | 🔴 Crítica |
| Relatórios globais | `views/admin/admin_relatorios.php` | 🟡 Alta |
| Configurações do sistema | `views/admin/admin_configuracoes.php` | 🟡 Alta |
| Configuração de banner | `views/admin/admin_banner.php` | 🟢 Média |
| Configuração PWA | `views/admin/admin_pwa.php` | 🟡 Alta |
| Revenda autorizada | `views/admin/admin_revenda_autorizada.php` | 🟢 Média |

### 🔄 Modo SaaS
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Configuração SaaS | `views/admin/saas_config.php` | 🟡 Alta |
| Gestão de planos | `views/admin/saas_planos.php` | 🟡 Alta |
| Gestão de gateways admin | `views/admin/saas_gateways.php` | 🟡 Alta |
| Assinaturas | `views/admin/saas_assinaturas.php` | 🟡 Alta |
| Limites de uso (produtos/pedidos) | `saas_limites_uso` table | 🟡 Alta |
| Checkout de planos SaaS | `saas/checkout_*.php` | 🟡 Alta |

### 🔗 Integrações
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Webhooks customizados | `views/integracoes_webhooks.php` | 🟡 Alta |
| UTMfy | `views/integracoes_utmfy.php` | 🟢 Média |
| Facebook Pixel | `checkout.php` (tracking) | 🟡 Alta |
| Google Analytics | `checkout.php` (tracking) | 🟡 Alta |
| Scripts manuais | `checkout_config.tracking` | 🟢 Média |

### 🌐 PWA e Push
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Service Worker | `sw.js` | 🟡 Alta |
| Manifest dinâmico | `manifest.json` / `api.php` | 🟡 Alta |
| Push Notifications | `pwa_push_*` tables | 🟢 Média |
| Instalação PWA | Header/scripts | 🟡 Alta |

### 🛠️ Utilidades
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Clonador de sites | `views/clonar_site.php` | 🟢 Média |
| Visualizador de sites clonados | `cloned_site_viewer.php` | 🟢 Média |
| Sistema de plugins | `plugins/` | 🟢 Baixa |
| Tracking de eventos | `starfy_tracking_*` tables | 🟢 Média |

### 🔒 Segurança
| Funcionalidade | Arquivo PHP Original | Prioridade |
|----------------|---------------------|------------|
| Rate limiting | `helpers/rate_limit.php`, `security_helper.php` | 🔴 Crítica |
| CSRF tokens | `config/csrf_helper.php` | 🔴 Crítica |
| Proteção de rotas | `config.php` session check | 🔴 Crítica |
| Logs de segurança | `security_helper.php` | 🟡 Alta |
| Bloqueio de IP | `login_attempts` table | 🟡 Alta |

---

## 📅 CRONOGRAMA DE MIGRAÇÃO (4 Semanas)

### 🗓️ SEMANA 1: Fundação e Autenticação

#### Dia 1-2: Setup do Projeto
- [x] Criar projeto Next.js 14 com App Router
- [x] Configurar TypeScript
- [x] Configurar Tailwind CSS
- [x] Instalar e configurar Prisma
- [x] Configurar PostgreSQL (local ou Coolify)
- [x] Criar Docker + docker-compose.yml
- [x] Setup ESLint + Prettier

#### Dia 3-4: Schema do Banco de Dados
- [x] Converter schema MySQL → Prisma (PostgreSQL)
- [x] Criar todas as tabelas/models
- [x] Configurar relações
- [x] Criar migrations
- [x] Popular dados seed (tipos de usuário, configs)
- [x] Testar conexão

#### Dia 5-7: Autenticação Completa
- [x] Configurar NextAuth.js
- [x] Implementar login
- [x] Implementar registro
- [x] Implementar "lembrar-me"
- [x] Implementar logout
- [x] Implementar forgot password
- [x] Implementar reset password
- [x] Middleware de proteção de rotas
- [x] Multi-tipo de usuário (roles)

### 🗓️ SEMANA 2: Checkout e Pagamentos

#### Dia 1-2: Página de Checkout
- [x] Componente de checkout dinâmico
- [x] Carregar produto por hash
- [x] Formulário de dados do cliente
- [x] Validação de CPF
- [x] Máscara de telefone
- [x] Formulário de endereço (CEP/ViaCEP)
- [x] Seletor de método de pagamento

#### Dia 3: Order Bumps e Resumo
- [x] Componente de order bump
- [x] Cálculo de total dinâmico
- [x] Resumo do pedido
- [x] Desconto visual

#### Dia 4: Timer e Elementos Visuais
- [x] Timer de urgência (persistente localStorage)
- [x] Notificações fake de vendas
- [x] Banners carrossel
- [x] Embed YouTube
- [x] Back redirect

#### Dia 5-7: Gateways de Pagamento
- [x] API Route para processar pagamento
- [x] Integração Mercado Pago (SDK)
- [x] Integração PushinPay (API) - *Estrutura pronta, aguardando chaves*
- [x] Integração Efí (API + certificado) - *Estrutura pronta, aguardando chaves*
- [x] Integração Beehive (API) - *Placeholder criado*
- [x] Integração Hypercash (API) - *Placeholder criado*
- [x] Modal de Pix QR Code
- [x] Página de obrigado
- [x] Polling de status
- [x] Formulário de cartão de crédito

### 🗓️ SEMANA 3: Webhooks, Dashboard e Área de Membros

#### Dia 1-2: Webhooks
- [x] API Route webhook Mercado Pago
- [x] API Route webhook PushinPay
- [x] API Route webhook Efí
- [x] API Route webhook Beehive
- [x] API Route webhook Hypercash
- [ ] Validação de assinatura - *Adicionado TODO (requer chaves secretas)*
- [x] Atualização de status de venda
- [x] Disparo de webhooks customizados (vendedor)
- [x] Integração UTMfy (via webhooks customizados com dados de UTM)

#### Dia 3: Emails e Notificações
- [x] Configurar Nodemailer/Resend (Implementado Nodemailer com Mock Dev)
- [x] Email de entrega de produto (Fila + Worker via CRON API)
- [x] Template de email customizável
- [x] Notificações internas (live) (API Endpoint implementado para polling)
- [x] Reenvio de email de acesso (Lógica via Service pronta)

#### Dia 4-5: Dashboard do Infoprodutor
- [x] Layout do dashboard
- [x] KPIs (vendas hoje, mês, total)
- [x] Gráfico de vendas (Recharts)
- [x] Tabela de vendas recentes
- [x] Filtros e paginação (Página de listagem)
- [x] Detalhes de venda (Página de detalhes completa)

#### Dia 6-7: Área de Membros
- [x] Login separado para membros (Implementado com JWT/Cookies)
- [x] Dashboard do aluno (Listagem de meus cursos)
- [x] Listagem de cursos/produtos
- [x] Player de vídeo (ReactPlayer com controles customizados)
- [x] Progresso de aulas (API + Botão de marcar concluída + Barra de progresso no sidebar)
- [x] Download de arquivos (API com verificação de acesso e release_days)
- [x] Liberação por tempo (release days) (Implementado no sidebar e página de aula)
- [x] Setup de senha (novos membros) (Página + API para configuração inicial)
- [x] Refinamento de UI/UX (Layout moderno, feedback de vídeo, mensagens de erro)

### 🗓️ SEMANA 4: Admin, SaaS, PWA e Polish

#### Dia 1-2: Painel Admin
- [x] Layout admin (Sidebar separada, validação de permissões)
- [x] Dashboard admin (métricas globais, usuários recentes)
- [x] Gestão de usuários (Listagem, filtros, detalhes)
- [x] Configurações do sistema
- [x] Configuração SMTP
- [x] Banner da plataforma
- [x] Configuração visual (logo, cores)

#### Dia 3: Modo SaaS
- [x] Configuração de SaaS on/off
- [x] CRUD de planos
- [ ] Gestão de assinaturas (Backend pronto, faltam telas de lista)
- [x] Limites de uso (Implementado no Backend e Dashboard)
- [x] Gateways admin (Mercado Pago implementado)
- [x] Checkout de planos (Fluxo completo implementado)

#### Dia 4: PWA e Push
- [x] Configurar next-pwa
- [x] Manifest dinâmico
- [x] Service Worker
- [x] Icons e splash (Estrutura pronta)
- [x] Push Notifications (VAPID + Componente + Admin)
- [x] Configuração PWA no admin

#### Dia 5: Gestão de Produtos
- [x] CRUD de produtos (APIs + Páginas de criação e edição)
- [x] Upload de imagens/arquivos (Local implementado)
- [x] Configuração de checkout
- [x] Editor visual de checkout (Propriedades + Preview em breve)
- [x] Order bumps
- [x] CRUD Avançado de Ensino (Módulos, Aulas, Upload de Arquivos, Drip)

#### Dia 6: Integrações e Extras
- [x] Webhooks customizados
- [x] UTMfy (Integração Nativa)
- [x] Tracking (Rastreamento configurável)
- [x] Clonador de sites (Implementado)
- [x] Recuperação de carrinho (Via Webhooks/Integrações)

#### Dia 7: Finalização e Deploy
- [ ] Testes E2E (Playwright)
- [ ] Testes de checkout completo
- [ ] Testes de webhooks (Simulação)
- [ ] Build de Produção
- [ ] Deploy (Vercel/Coolify)
- [ ] Configuração de Domínio e SSL
- [ ] Monitoramento (Sentry)

---

## 🔄 MAPEAMENTO DE ROTAS

### Rotas Públicas
| Rota PHP | Rota Next.js |
|----------|--------------|
| `/login` | `/login` |
| `/register` | `/register` |
| `/forgot-password` | `/forgot-password` |
| `/reset-password` | `/reset-password` |
| `/checkout?p=HASH` | `/checkout/[hash]` |
| `/obrigado` | `/obrigado` |
| `/member_login` | `/member/login` |

### Rotas do Infoprodutor
| Rota PHP | Rota Next.js |
|----------|--------------|
| `/index` (dashboard) | `/dashboard` |
| `/index?pagina=produtos` | `/dashboard/produtos` |
| `/index?pagina=vendas` | `/dashboard/vendas` |
| `/index?pagina=configuracoes` | `/dashboard/configuracoes` |
| `/index?pagina=integracoes` | `/dashboard/integracoes` |

### Rotas Admin
| Rota PHP | Rota Next.js |
|----------|--------------|
| `/admin` | `/admin` |
| `/admin?pagina=admin_usuarios` | `/admin/usuarios` |
| `/admin?pagina=saas_config` | `/admin/saas` |

### Rotas da Área de Membros
| Rota PHP | Rota Next.js |
|----------|--------------|
| `/member_area_dashboard` | `/member` |
| `/member_area_cursos` | `/member/cursos` |
| `/member_area_aula` | `/member/aula/[id]` |

### API Routes
| Rota PHP | Rota Next.js |
|----------|--------------|
| `/api/api.php?action=X` | `/api/[action]/route.ts` |
| `/api/notification.php` | `/api/webhooks/mercadopago/route.ts` |
| `/process_payment.php` | `/api/payments/process/route.ts` |
| `/check_status.php` | `/api/payments/status/route.ts` |

---

## 🗃️ MIGRAÇÃO DE DADOS

### Script de Migração MySQL → PostgreSQL

```sql
-- 1. Exportar do MySQL
mysqldump -u usuario -p banco > backup.sql

-- 2. Converter tipos de dados
-- INT AUTO_INCREMENT → SERIAL ou usar CUID/UUID
-- TINYINT(1) → BOOLEAN
-- TEXT → TEXT
-- DECIMAL → DECIMAL ou NUMERIC
-- TIMESTAMP → TIMESTAMPTZ
-- VARCHAR → VARCHAR ou TEXT

-- 3. Ajustar sintaxe
-- `` (backticks) → "" (aspas duplas) ou remover
-- ENGINE=InnoDB → remover
-- COLLATE → remover (deixar padrão UTF-8)
```

### Prisma Migrate
```bash
# Gerar migration inicial
npx prisma migrate dev --name init

# Aplicar em produção
npx prisma migrate deploy

# Popular dados iniciais
npx prisma db seed
```

---

## ✅ CHECKLIST PRÉ-DEPLOY

### Segurança
- [ ] Variáveis de ambiente configuradas (não commitadas)
- [ ] HTTPS forçado
- [ ] Headers de segurança configurados
- [ ] Rate limiting implementado
- [ ] CSRF tokens funcionando
- [ ] Validação de entrada (Zod) em todas as APIs

### Performance
- [ ] Imagens otimizadas (next/image)
- [ ] Lazy loading implementado
- [ ] Cache configurado (Redis ou edge)
- [ ] Bundle size otimizado

### Funcionalidades
- [ ] Todos os gateways testados
- [ ] Webhooks recebendo corretamente
- [ ] Emails sendo enviados
- [ ] PWA instalável
- [ ] Área de membros funcionando
- [ ] Admin funcionando

### Infraestrutura
- [ ] PostgreSQL rodando no Coolify
- [ ] Backups automáticos configurados
- [ ] Domínio apontando corretamente
- [ ] SSL/TLS ativo
- [ ] Monitoramento configurado (Sentry, Uptime)

---

## 📞 SUPORTE E ROLLBACK

### Em caso de problemas:
1. Manter PHP rodando em paralelo até validação completa
2. Usar feature flags para migração gradual
3. Backups diários do banco de dados
4. Logs detalhados para debugging

### Rollback:
1. Reverter DNS para servidor PHP
2. Restaurar backup do MySQL
3. Investigar e corrigir problema
4. Re-deploy quando estável

---

*Documento criado em: 2026-01-04*
*Última atualização: 2026-01-04*
