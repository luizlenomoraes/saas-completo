# 🚀 Checkout Platform - Next.js

Plataforma completa de checkout, vendas e área de membros migrada de PHP para Next.js 14+.

## ✨ Funcionalidades

### 💳 Checkout
- Múltiplos gateways de pagamento (Mercado Pago, PushinPay, Efí, Beehive, Hypercash)
- Pix, Cartão de Crédito e Boleto
- Order Bumps
- Timer de urgência
- Notificações de vendas fake
- Tracking (Facebook Pixel, Google Analytics)

### 📊 Dashboard do Infoprodutor
- KPIs de vendas (hoje, mês, total)
- Gráficos de vendas
- Gestão de produtos
- Gestão de vendas
- Configurações de checkout visual

### 🎓 Área de Membros
- Cursos com módulos e aulas
- Player de vídeo
- Progresso de aulas
- Download de arquivos
- Liberação por tempo (release days)

### 👑 Painel Administrativo
- Gestão de usuários
- Configurações do sistema
- Modo SaaS com planos

### 📱 PWA
- Instalável em dispositivos móveis
- Push Notifications
- Funciona offline

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js
- **Estilização**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn/UI
- **Email**: Nodemailer
- **Deploy**: Docker + Coolify

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker (opcional)

### Instalação Local

```bash
# 1. Clonar repositório
cd checkout-nextjs

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais

# 5. Criar banco de dados
npx prisma migrate dev

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

### Deploy com Docker

```bash
# Build e iniciar
docker-compose up -d

# Acessar em http://localhost:3000
```

### Deploy no Coolify

1. Criar novo serviço no Coolify
2. Conectar ao repositório Git
3. Configurar variáveis de ambiente
4. Adicionar PostgreSQL como serviço
5. Deploy!

## 📁 Estrutura de Pastas

```
checkout-nextjs/
├── app/                    # App Router (páginas e API)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Painel do infoprodutor
│   ├── admin/             # Painel administrativo
│   ├── checkout/          # Páginas de checkout
│   ├── member/            # Área de membros
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── checkout/         # Componentes de checkout
│   ├── dashboard/        # Componentes do dashboard
│   └── member/           # Componentes da área de membros
├── lib/                   # Utilitários e bibliotecas
│   ├── gateways/         # Integrações com gateways
│   ├── auth.ts           # Configuração NextAuth
│   ├── db.ts             # Cliente Prisma
│   ├── email.ts          # Envio de emails
│   └── utils.ts          # Funções utilitárias
├── prisma/               # Schema e migrations
├── public/               # Arquivos estáticos
└── docs/                 # Documentação
```

## 🔒 Segurança

- ✅ Autenticação com JWT
- ✅ Proteção CSRF
- ✅ Rate Limiting
- ✅ Validação de entrada com Zod
- ✅ Headers de segurança
- ✅ Variáveis de ambiente
- ✅ Prepared statements (Prisma)

## 📝 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://..."

# Autenticação
NEXTAUTH_URL="https://seudominio.com"
NEXTAUTH_SECRET="..."

# Email
SMTP_HOST="..."
SMTP_PORT="465"
SMTP_USER="..."
SMTP_PASS="..."

# Aplicação
NEXT_PUBLIC_APP_URL="https://seudominio.com"
```

## 🔄 Migração do PHP

Este projeto é uma migração completa do sistema PHP original. Todas as funcionalidades foram preservadas:

- [x] Autenticação (login, registro, recuperação de senha)
- [x] Checkout com múltiplos gateways
- [x] Order bumps
- [x] Webhooks
- [x] Área de membros
- [x] Dashboard
- [x] Painel admin
- [x] PWA
- [x] Emails transacionais
- [x] Integrações (UTMfy, webhooks customizados)

## 📄 Licença

Proprietary - Todos os direitos reservados.

---

Desenvolvido com ❤️ usando Next.js
