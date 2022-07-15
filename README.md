# 🌸 Xananas' Garden — MVP

Catálogo de produtos, PDV (Ponto de Venda), administração completa e chatbot com IA para loja de jardim.

## 📸 Visão Geral

| Feature | Status |
|---------|--------|
| Catálogo público com busca, filtros e view toggle (lista/grade) | ✅ |
| Página de produto com carrossel unificado (fotos + vídeo YouTube) | ✅ |
| Gallery lightbox fullscreen com navegação por teclado | ✅ |
| Slugs SEO-friendly (`/catalogo/{slug}`) | ✅ |
| Envio de pedido via WhatsApp | ✅ |
| Chatbot com memória de cookies | ✅ |
| Admin: CRUD de produtos, categorias, imagens | ✅ |
| Admin: Controle de ordem do carrossel | ✅ |
| Admin: Editor rich text (TipTap) com suporte Markdown | ✅ |
| PDV (Ponto de Venda) com controle de estoque | ✅ |
| Gerenciamento de usuários (Admin/Usuário) | ✅ |
| Autenticação JWT com rotas protegidas | ✅ |
| Login oculto via `Ctrl+Alt+Shift+L` | ✅ |
| Upload e compressão de imagens (Sharp) | ✅ |
| Splash screen animada | ✅ |
| Responsividade mobile completa | ✅ |
| Validações Zod (front + back) | ✅ |

## 🏗️ Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (Pages Router) |
| Linguagem | TypeScript 5.7 |
| UI | Tailwind CSS 3.4 + Phosphor Icons |
| ORM | Prisma 6.9 |
| Banco (dev) | SQLite |
| Banco (prod) | PostgreSQL (Torso / qualquer provedor) |
| Validação | Zod 3.24 |
| Editor Rich Text | TipTap 3.30 |
| Imagens | Sharp 0.33 + Next.js Image |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Charts | Chart.js + react-chartjs-2 |

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+ (recomendado: 24.x)
- npm ou yarn

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais (ver seção [Variáveis de Ambiente](#-variáveis-de-ambiente)).

### 3. Inicializar banco de dados

```bash
npx prisma migrate dev
npm run seed
```

### 4. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse:
- **Loja:** [http://localhost:3000/catalogo](http://localhost:3000/catalogo)
- **Admin:** Pressione `Ctrl+Alt+Shift+L` em qualquer página

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar servidor de produção |
| `npm run lint` | Verificação de código |
| `npm run seed` | Popular banco com dados de exemplo |
| `npm run db:reset` | Resetar banco e re-seed |
| `npm run db:studio` | Abrir Prisma Studio (GUI do banco) |

## 🔐 Variáveis de Ambiente

### Arquivo `.env.example`

```env
# ============================================
# BANCO DE DADOS
# ============================================
# Desenvolvimento (SQLite):
DATABASE_URL="file:./dev.db"

# Produção (PostgreSQL - Torso ou outro provedor):
# DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# ============================================
# AUTENTICAÇÃO
# ============================================
# Chave secreta para JWT (MUDE EM PRODUÇÃO!)
JWT_SECRET="sua-chave-secreta-aqui-mude-em-producao"

# ============================================
# APLICAÇÃO
# ============================================
# NODE_ENV é definido automaticamente pelo Next.js
# "development" em dev, "production" em build/start
```

### Variáveis detalhadas

| Variável | Obrigatória | Descrição | Valor padrão |
|----------|:-----------:|-----------|-------------|
| `DATABASE_URL` | ✅ | URL de conexão com o banco de dados | `file:./dev.db` (SQLite) |
| `JWT_SECRET` | ✅ | Chave secreta para assinatura de tokens JWT | `xananas-garden-secret` (⚠️ NÃO usar em prod) |

### Para produção (PostgreSQL)

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO?schema=public"
JWT_SECRET="uma-chave-forte-e-unica-com-32-ou-mais-caracteres"
```

> ⚠️ **Segurança:** Gere um `JWT_SECRET` forte para produção:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

## 🗄️ Estrutura do Banco

```
User (usuários)
├── id, name, username, email, admin, password
│
Product (produtos)
├── id, name, slug (unique), description (HTML/Markdown)
├── price, amount, published, videoUrl, videoPosition
├── categoryId → ProductCategory
├── images → ProductImage[]
│
ProductCategory (categorias)
├── id, name (unique)
│
ProductImage (imagens do carrossel)
├── id, image (URL/base64), imageSm (thumbnail)
├── order (posição no carrossel)
├── productId → Product
│
Sale (vendas do PDV)
├── id, total, discount, finalTotal
├── paymentType (money/card/pix), notes
├── userId → User
├── items → SaleItem[]
│
SaleItem (itens da venda)
├── id, quantity, unitPrice, subtotal
├── saleId → Sale
├── productId → Product
```

## 📁 Estrutura do Projeto

```
src/
├── pages/                    # Rotas Next.js
│   ├── _app.tsx             # Provider global + atalho de teclado
│   ├── _document.js         # Splash screen + meta tags
│   ├── index.tsx            # Redirect para /catalogo
│   ├── catalogo/            # Catálogo público
│   │   ├── index.tsx        # Listagem com busca/filtros
│   │   └── [slug]/          # Detalhe do produto
│   └── admin/               # Área administrativa
│       ├── login/           # Login (oculto)
│       └── dashboard/       # Painel admin
│           ├── pdv/         # Ponto de Venda
│           ├── produtos/    # CRUD produtos
│           ├── categorias/  # CRUD categorias
│           └── usuarios/    # Gerenciamento de usuários
├── components/              # Componentes React
│   ├── Header/              # Navbar do catálogo
│   ├── Sidebar/             # Filtros do catálogo
│   ├── Content/             # Grid/lista de produtos
│   ├── Gallery/             # Lightbox fullscreen
│   ├── ChatBot/             # Chatbot com IA
│   ├── TipTapEditor/        # Editor rich text
│   ├── AdminHeader/         # Header admin
│   ├── AdminSidebar/        # Sidebar admin
│   ├── AuthGuard/           # Proteção de rotas
│   ├── Toast/               # Sistema de notificações
│   └── DefaultPage/         # Wrapper de página
├── lib/                     # Utilitários
│   ├── api.ts               # Cliente Axios configurado
│   ├── prisma.ts            # Instância Prisma (singleton)
│   ├── validations.ts       # Schemas Zod
│   └── slugify.ts           # Geração de slugs
├── hooks/                   # Hooks customizados
│   └── useAuth.ts           # Autenticação JWT
├── server/                  # Backend (Service Layer)
│   └── src/
│       ├── controllers/     # Controllers HTTP
│       ├── services/        # Lógica de negócio
│       └── repositories/    # Acesso a dados (Prisma)
└── assets/                  # SVGs e estáticos
```

## 🔑 Acesso ao Admin

### Via atalho de teclado (oculto)

Em qualquer página, pressione:

```
Ctrl + Alt + Shift + L
```

Isso abrirá o login em popup centralizado.

### Credenciais padrão (seed)

| Usuário | Senha | Tipo |
|---------|-------|------|
| `admin` | `admin123` | Admin |
| `vendedor` | `vendedor123` | Usuário |

> ⚠️ Altere as senhas após o primeiro login em produção.

## 📱 Funcionalidades

### Catálogo Público

- **Busca em tempo real** — filtra por nome, descrição e categoria
- **Filtros** — por categoria e ordenação (preço, nome, data)
- **View toggle** — Lista (horizontal) ou Grade (cards verticais)
- **Grade mobile** — produtos agrupados por categoria em scroll horizontal
- **Página de detalhe** — carrossel unificado com fotos e vídeos YouTube
- **Gallery lightbox** — clique para ampliar, navegue com ← → ou clique
- **WhatsApp** — botão de compra com mensagem pré-formatada
- **Compartilhar** — Web Share API + fallback clipboard

### Admin

- **Dashboard** — vendas de hoje, faturamento total, ações rápidas
- **Produtos** — CRUD completo, upload de imagens, editor rich text
- **Carrossel** — reordenação de imagens, posição do vídeo
- **Categorias** — CRUD simples
- **PDV** — seleção de produtos, carrinho, pagamento, baixa de estoque
- **Usuários** — criar, editar, excluir, definir perfil (Admin/Usuário)

### Chatbot

- Botão flutuante no canto inferior direito
- Mensagens pré-prontas para produtos
- Cookies do usuário para sugerir produtos
- Efeitos sonoros ao enviar/receber mensagens

## 🛡️ Segurança

- **Login oculto** — nenhum link visível no frontend público
- **Rotas protegidas** — AuthGuard verifica JWT em todas as páginas admin
- **Validações Zod** — front e back-end
- **JWT + bcrypt** — senhas hasheadas, tokens assinados
- **CSP headers** — Content-Security-Policy configurado

## 🚢 Deploy

### Vercel (recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy é automático a cada push

### Outros provedores

```bash
npm run build
npm run start
```

Certifique-se de configurar:
- `DATABASE_URL` para PostgreSQL em produção
- `JWT_SECRET` com valor forte e único
- Proxy reverso (nginx, Caddy) na frente do Next.js

## 📄 Licença

Proprietária — © Xananas' Garden 2026
