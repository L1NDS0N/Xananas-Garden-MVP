# 📋 Análise Comparativa: nextjs13 vs main

## Arquitetura Geral

| Aspecto | nextjs13 | main (atual) |
|---------|----------|---------------|
| **Framework** | Next.js 13 (App Router) | Next.js 12 (Pages Router) |
| **UI Library** | Radix UI Themes | Tailwind CSS puro |
| **Ícones** | Lucide React (dynamic imports) | Phosphor React |
| **Forms** | react-hook-form + zodResolver | Controle manual + Zod |
| **Toasts** | Radix UI Toast (swipe gestures) | Componente custom (fade animations) |
| **Auth Context** | React Context + sessionStorage | Cookies + JWT manual |
| **Estilo** | Prefixo "X" (XButton, XPage...) | Nomes descritivos (Button, DefaultPage) |

---

## 🏗️ Backend (nextjs13)

### NextApiRouter
```ts
// Router middleware-based (estilo Express)
const router = createNextApiRouter();
router.use(authenticateAdminMiddleware);
router.get(handler);
router.post(handler);
export default router.handle();
```
** Valor:** Permite encadear middlewares por rota, tratamento centralizado de erros.

### ApiError + Error Middleware
```ts
// Erros estruturados com status codes
throw new BadRequestError(GENERIC_MESSAGES, { cases: 'required_field', field: 'nome' });
throw new NotFoundError(GENERIC_MESSAGES, { cases: 'not_found' });
throw new UnauthorizedError(GENERIC_MESSAGES, { cases: 'not_found' });
```
**Valor:** Mensagens de erro em PT-BR configuráveis, com gênero (masculino/feminino).

### Generic Controller + Generic Repository
```ts
// Controller genérico com CRUD pronto
class TGenericController<T> {
  index()   // GET /
  show()    // GET /:id
  store()   // POST /
  patch()   // PUT /:id
  remove()  // DELETE /:id
}

// Repository genérico para Prisma
class TGenericRepository<T> {
  index()     // findMany()
  create()    // create()
  findOne()   // findUnique()
  updateOne() // update()
  deleteOne() // delete()
}
```
**Valor:** Não precisa reimplementar CRUD para cada entidade. Basta herdar e customizar.

### Authenticate Middleware
```ts
// JWT + userSecret validation
const authenticateAdminMiddleware = async (req, res, next) => {
  // Verifica token, userSecret, e se é admin
  // Suporta first_user (primeiro cadastro sem auth)
  next();
};
```
**Valor:** Segurança robusta com dupla validação (token + secret do usuário).

---

## 🎨 Frontend (nextjs13)

### Componentes de Design System

#### XButton
```tsx
// Dois variantes: Primary e Secondary
<XButton xType="Primary" xTitle="Cadastrar" />
<XButton xType="Secondary" xTitle="Voltar" />
```
**Comparação com main:** O main tem Button e Input genéricos. O XButton tem variantes tipadas.

#### XPage (DefaultPage)
```tsx
// Wrapper de página com Head/meta tags
<XPage title="Login - Autentique-se no sistema">
  {children}
</XPage>
```
**Comparação:** Equivalente ao DefaultPage do main, mas com interface mais limpa.

#### XInput (com ícone)
```tsx
// Input com suporte a ícone via Lucide
<XInput icon={{ name: "package" }} placeholder="Nome" />
<XInput icon={{ name: "receipt" }} placeholder="Preço" />
```
**Comparação:** O main usa Input genérico sem suporte a ícones. O XInput usa Radix TextField com slot de ícone.

#### XIcon (dynamic loading)
```tsx
// Carrega ícones do Lucide dinamicamente
<XIcon name="CheckCheck" size={20} tailwindColor="text-green-700" />
<XIcon name="XOctagon" size={20} tailwindColor="text-red-700" />
```
**Valor:** Ícones carregados sob demanda, reduzindo bundle size.

#### XToast (Radix UI)
```tsx
// Toast com 4 variantes + swipe gestures + botão desfazer
showXToast({ type: 'success', title: 'Sucesso', description: 'Categoria criada!' });
showXToast({ type: 'alert', title: 'Erro', description: 'Campo obrigatório' });
showXToast({ type: 'warning', title: 'Atenção', description: 'Estoque baixo' });
showXToast({ type: 'info', title: 'Info', description: 'Produto disponível' });
```
**Comparação:** O main tem Toast com fade animation. O XToast tem swipe para dismiss, grid layout, e botão "Desfazer".

#### XSidebar
```tsx
// Sidebar genérica com itens via props
<XSidebar
  title="Administração"
  items={[
    { href: "/admin/dashboard/cadastrar/categorias", name: "Categorias" },
    { href: "/admin/dashboard/cadastrar/produtos", name: "Produtos" },
  ]}
/>
```
**Comparação:** O main tem AdminSidebar fixo. O XSidebar é reutilizável e configurável.

#### XContent (Catálogo)
```tsx
// Grid responsivo de produtos com hover effects
// Layout: grid-cols-1 md:grid-cols-1 lg:grid-cols-2
// Card com imagem à esquerda, info à direita
// Botão WhatsApp aparece no hover
```

### Login (nextjs13)
```tsx
// react-hook-form + zodResolver
const { register, handleSubmit, formState: { errors } } = useForm<TLoginUserAdmin>({
  resolver: zodResolver(adminUserLoginSchema),
});

// Erros inline abaixo de cada campo
{errors.username && <span className="text-sm text-red-400">{errors.username.message}</span>}
```
**Comparação:** O main usa controle manual de estado. O nextjs13 usa react-hook-form (mais limpo, menos boilerplate).

### Admin Dashboard (nextjs13)
```tsx
// Layout com XAdminHeader + XSidebar
// Sidebar configurável com itens
// Página de categorias: tabela + formulário de criação com toggle
// Página de produtos: formulário com Select do Radix
```

### Auth Context (nextjs13)
```tsx
// React Context para autenticação
const { handleLogin, signOut, isLoading, user } = useAuth();
// Salva em sessionStorage
sessionStorage.setItem("@xg:user", JSON.stringify(res.data));
```
**Comparação:** O main usa cookies com js-cookie. O nextjs13 usa sessionStorage + React Context.

### Generic Routes (Frontend)
```ts
// Classe genérica para chamadas API
class GenericRoutes<T> {
  get({ then, catch, finally })     // GET
  getOne({ then, catch, id })       // GET /:id
  post({ then, catch, data })       // POST
  put({ then, catch, id, data })    // PUT /:id
  delete({ then, catch, id })       // DELETE /:id
}

// Uso:
const productService = new ProductCategoriesRoutes();
productService.get({ then: ({ data }) => setCategories(data) });
productService.post({ data, then: fetchCategories });
```
**Comparação:** O main usa `api.get/post/put/delete` diretamente. O nextjs13 encapsula em classes tipadas.

### Root Layout (nextjs13)
```tsx
// Atalho de teclado: Ctrl+Alt+Shift+L → abre login
// Providers: Theme (Radix) → XToastContext → UserAuth
```

---

## 📊 O que está FALTANDO no main (que o nextjs13 tem)

### 🔴 Alta Prioridade
1. **react-hook-form** — Forms mais limpos, menos useState para cada campo
2. **Radix UI Toast** — Toast profissional com swipe gestures
3. **Dynamic Icon Loading** — Ícones carregados sob demanda

### 🟡 Média Prioridade
4. **XButton com variantes** — Design system consistente
5. **XInput com ícone** — Inputs com slot de ícone
6. **Generic Routes (frontend)** — Classes tipadas para chamadas API
7. **Auth Context pattern** — React Context em vez de cookies manuais
8. **handleKnownError** — Tratamento padronizado de erros Axios

### 🟢 Baixa Prioridade
9. **Generic Controller + Repository (backend)** — Padrão CRUD herdável
10. **NextApiRouter** — Router middleware-based
11. **ApiError classes** — Erros estruturados com status codes
12. **App Rules** — Regras de validação centralizadas
13. **Testes (Jest)** — Infraestrutura de testes

---

## 🎯 Recomendação

**Não migrar o backend agora** (como você planeja atualizar o Next.js). Mas incorporar ao main:

1. **react-hook-form** nos forms admin (login, categorias, produtos, PDV, usuários)
2. **Radix Toast** substituindo o Toast custom
3. **XButton/XInput design system** com variantes tipadas
4. **Generic Routes** como wrapper do api axios
5. **handleKnownError** para tratar erros de API uniformemente
