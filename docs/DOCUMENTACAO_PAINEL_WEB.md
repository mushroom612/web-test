# TucTuc — Painel de Gestão Web — Documentação Técnica Completa

> **Versão das dependências:** ver `package.json` (mantida fora desta doc para não envelhecer).
> **Público-alvo:** Desenvolvedores humanos e agentes de IA que precisam se situar no projeto rapidamente.
> **Idioma:** Português do Brasil.
> **Escopo:** Este documento cobre **apenas o painel web** (administradores e desenvolvedores). O aplicativo mobile tem documentação própria (`DOCUMENTACAO_TUCTUC.md`).

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Design System e Tema](#5-design-system-e-tema)
6. [Roteamento e Controle de Acesso (RBAC)](#6-roteamento-e-controle-de-acesso-rbac)
7. [Contexto Global (AuthContext)](#7-contexto-global-authcontext)
8. [Autenticação e Sessão](#8-autenticação-e-sessão)
9. [Camada de API (http.js + api.js)](#9-camada-de-api-httpjs--apijs)
10. [Páginas e Funcionalidades](#10-páginas-e-funcionalidades)
11. [Componentes Reutilizáveis](#11-componentes-reutilizáveis)
12. [Ícones](#12-ícones)
13. [Armazenamento Local (localStorage)](#13-armazenamento-local-localstorage)
14. [WebSocket e Tempo Real (Suporte)](#14-websocket-e-tempo-real-suporte)
15. [Sistema de Penalidades](#15-sistema-de-penalidades)
16. [Sanitização de Erros e Feedback de UI](#16-sanitização-de-erros-e-feedback-de-ui)
17. [Geração de Relatórios (PDF/CSV)](#17-geração-de-relatórios-pdfcsv)
18. [Polling e Atualização de Dados](#18-polling-e-atualização-de-dados)
19. [Convenções do Projeto](#19-convenções-do-projeto)
20. [Regras de Negócio](#20-regras-de-negócio)
21. [Integração com o Backend (API)](#21-integração-com-o-backend-api)
22. [Build, Ambiente e Deploy](#22-build-ambiente-e-deploy)
23. [Dados Mock (histórico)](#23-dados-mock-histórico)
24. [Fluxos Detalhados](#24-fluxos-detalhados)
25. [Decisões de Implementação e Motivos](#25-decisões-de-implementação-e-motivos)
26. [Códigos de Erro HTTP](#26-códigos-de-erro-http)
27. [Versionamento e Dependências](#27-versionamento-e-dependências)
28. [Roadmap e Limitações Conhecidas](#28-roadmap-e-limitações-conhecidas)

---

## 1. Visão Geral do Projeto

O **Painel de Gestão Web TucTuc** é a interface administrativa da plataforma de carona solidária TucTuc. É uma **SPA (Single Page Application)** construída com **React 19 + Vite 8**, consumida exclusivamente por usuários habilitados — administradores de instituições parceiras e desenvolvedores da plataforma. Usuários finais (estudantes) **não** têm acesso ao painel; eles usam o aplicativo mobile.

### Objetivos Principais

| Objetivo              | Descrição                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| Gestão de usuários  | Visualizar, editar, controlar status e aplicar penalidades aos usuários do app |
| Moderação           | Tratar sugestões e denúncias enviadas pelo app mobile                         |
| Acompanhamento        | Visualizar caronas, métricas e relatórios da plataforma                       |
| Gestão institucional | (Dev) Cadastrar instituições, contratos, cursos e administradores             |
| Auditoria             | (Dev) Inspecionar e exportar logs de todas as ações realizadas                |
| Suporte               | Canal de comunicação em tempo real entre admins e desenvolvedores             |

### Dois Perfis de Acesso (RBAC)

| `per_tipo` | Papel          | Escopo no painel                                                                                    |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------- |
| `0`        | Usuário comum | **Bloqueado** — não pode logar no painel                                                    |
| `1`        | Administrador  | Escopo restrito à própria instituição (o backend filtra via JWT)                                |
| `2`        | Desenvolvedor  | Acesso global a todas as instituições e às telas exclusivas (Instituições, Auditoria, Suporte) |

### Fluxo Principal de Uso

```
Login (e-mail + senha)
   ↓ valida per_tipo ≥ 1
Painel (métricas + feedbacks recentes)
   ↓
Admin: Usuários · Caronas · Relatórios · Sugestões/Denúncias · Contratos
Dev:   tudo acima + Instituições · Auditoria · Suporte
```

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR (SPA React)                    │
│                                                           │
│  ┌──────────────┐                                         │
│  │ AuthContext  │  estado global (user, role, login)      │
│  └──────┬───────┘                                         │
│         │                                                 │
│  ┌──────┴───────────────────────────────────────────┐    │
│  │  services/api.js  (camada "inteligente")          │    │
│  │  services/http.js (camada "burra": fetch + token) │    │
│  └──────┬─────────────────────────────┬──────────────┘    │
│         │ HTTPS REST                   │ Socket.io         │
└─────────┼─────────────────────────────┼───────────────────┘
          │                             │ /suporte namespace
┌─────────┼─────────────────────────────┼───────────────────┐
│              BACKEND (Express.js / API-test)              │
│  adminRoutes · devRoutes · usuarioRoutes · ...            │
│  authMiddleware (JWT) · roleMiddleware (RBAC)             │
│  Socket.io (chat de suporte em tempo real)               │
└──────────────────────────┬────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│                 BANCO DE DADOS (MySQL)                     │
│  USUARIOS · CARONAS · PENALIDADES · SUGESTOES · DENUNCIAS  │
│  ESCOLAS · CURSOS · AUDIT_LOG · SUPORTE_MENSAGENS · ...    │
└───────────────────────────────────────────────────────────┘
```

**Separação de responsabilidades:**

- **`context/`** — estado global de autenticação (único contexto do projeto: `AuthContext`).
- **`services/`** — camada de I/O sem estado. `http.js` é a base "burra" (fetch + token + refresh); `api.js` é a camada "inteligente" que conhece os endpoints.
- **`hooks/`** — lógica reutilizável com estado (`useSuporteSocket`).
- **`pages/`** — telas com estado local de UI; orquestram serviços.
- **`components/`** — componentes visuais reutilizáveis, recebem dados via props.
- **`layouts/`** — molduras visuais (AdminLayout com menu+topbar, PublicLayout para login).
- **`router/`** — definição de rotas e guardas (`PrivateRoute`, `DevRoute`).

> **Diferença em relação ao app mobile:** o painel tem **apenas um contexto global** (autenticação). Estado de servidor (listas, métricas) é gerenciado localmente em cada página com `useState` + `useEffect`, sem biblioteca de cache. Caches existem em nível de serviço (`statsCache` em `api.js`) e local de página (`detailCache` em Caronas).

---

## 3. Stack Tecnológica

### Runtime e Build

| Tecnologia | Papel                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| React 19   | Biblioteca de UI (function components + hooks)                                     |
| Vite 8     | Bundler e dev server (porta 5173); usa `@vitejs/plugin-react`                    |
| ESLint 9   | Lint (flat config);`eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |

> **Renderização:** CSR puro (Client-Side Rendering). Não há SSR/SSG — o `index.html` carrega o bundle e o React monta tudo no `<div id="root">`.

### Roteamento e Comunicação

| Biblioteca                                | Papel                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `react-router` / `react-router-dom` 7 | Roteamento SPA (`BrowserRouter`, `useRoutes`, `Outlet`, `NavLink`) |
| `fetch` (nativo)                        | Chamadas REST à API (encapsulado em `http.js`)                          |
| `socket.io-client` 4                    | WebSocket para o chat de suporte em tempo real                             |

### UI / Gráficos / Documentos

| Biblioteca                      | Papel                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `@tabler/icons-react`         | Ícones SVG (padrão do projeto — substituiu o lucide-react citado em comentários antigos) |
| `recharts`                    | Gráfico de área do Painel (caronas por dia da semana)                                      |
| `jspdf` + `jspdf-autotable` | Exportação de relatórios e logs em PDF (importação dinâmica / lazy)                    |
| CSS Modules                     | Estilização escopada por componente (`*.module.css`)                                     |
| CSS Custom Properties           | Design tokens em `global.css` (`:root { --... }`)                                        |

### Fontes

Carregadas via Google Fonts no `index.html`:

- **Roboto** — texto base (`body`)
- **Space Grotesk** — títulos/headings (`--font-family-heading`)

---

## 4. Estrutura de Pastas

```
web-test/
├── index.html                  # Template HTML; carrega fontes + /src/main.jsx
├── vite.config.js              # Config Vite (plugin React, porta 5173)
├── package.json                # Dependências e scripts (dev/build/lint/preview)
├── eslint.config.js            # Flat config do ESLint
│
├── public/                     # Assets servidos como estão (favicon.svg, logo-texto.png)
│
├── docs/
│   ├── estudo/                 # Trilha didática de estudo (16 módulos + glossário)
│   └── DOCUMENTACAO_PAINEL_WEB.md  # Este documento
│
└── src/
    ├── main.jsx                # Ponto de entrada: createRoot + <StrictMode><App/>
    ├── App.jsx                 # AppWrapper: <Router><AuthProvider><App/> (useRoutes)
    ├── global.css              # Reset + design tokens + classes utilitárias globais
    │
    ├── router/
    │   └── routes.jsx          # Array de rotas + guardas PrivateRoute/DevRoute
    │
    ├── context/
    │   └── AuthContext.jsx     # Estado global de autenticação (useAuth)
    │
    ├── hooks/
    │   └── useSuporteSocket.js # Conexão Socket.io ao namespace /suporte
    │
    ├── services/
    │   ├── http.js             # Cliente HTTP base (fetch + token + refresh + sanitize)
    │   └── api.js              # Métodos por endpoint (login, getUsers, getStats, ...)
    │
    ├── layouts/
    │   ├── AdminLayout.jsx     # Moldura interna: Aside + Topbar + <Outlet/>
    │   └── PublicLayout.jsx    # Moldura pública (só Login)
    │
    ├── components/
    │   ├── Aside.jsx           # Menu lateral (navegação + card do usuário + logout)
    │   ├── Topbar.jsx          # Barra superior (título da página, suporte, logout)
    │   ├── StatusBadge.jsx     # Badge colorido de status
    │   ├── Pagination.jsx      # Controle de paginação (anterior/próximo)
    │   ├── LoadingSpinner.jsx  # Spinner de carregamento
    │   ├── EmptyState.jsx      # Estado vazio (ícone + título + ação)
    │   ├── ErrorBanner.jsx     # Banner de erro com botão "Tentar novamente"
    │   ├── FeedbackCard.jsx    # Card de sugestão/denúncia (Painel)
    │   ├── PenaltyPanel.jsx    # Painel lateral de penalidades de um usuário
    │   ├── UserProfilePanel.jsx# Painel lateral de perfil/edição de usuário
    │   ├── UserActionsMenu.jsx # Menu ⋮ de ações por linha (ver/editar/penalizar/status)
    │   └── SupportChatPanel.jsx# Painel flutuante de chat de suporte (lado Admin)
    │
    └── pages/
        ├── Login.jsx           # Login + recuperação de senha (4 etapas)
        ├── Painel.jsx          # Métricas + gráfico + feedbacks recentes
        ├── Usuarios.jsx        # Lista de usuários + ações + painéis laterais
        ├── Caronas.jsx         # Lista mestre-detalhe de caronas
        ├── Sugestoes.jsx       # Sugestões e denúncias (mestre-detalhe + moderação)
        ├── Relatorios.jsx      # Geração/download de relatórios CSV e PDF
        ├── Instituicoes.jsx    # (Dev) Lista de instituições + gestão de cursos
        ├── Cadastrar.jsx       # (Dev) Wizard de nova instituição (4 passos)
        ├── Contratos.jsx       # Contratos institucionais + admins por escola
        ├── Auditoria.jsx       # (Dev) Logs de auditoria com abas Painel/App
        └── Suporte.jsx         # (Dev) Inbox de conversas de suporte
```

---

## 5. Design System e Tema

Arquivo principal: **`src/global.css`**

O visual é construído a partir de **design tokens** (CSS Custom Properties) declarados em `:root`. **Nunca use valores hardcoded** de cor, espaçamento ou radius — sempre consuma via `var(--token)`.

> ⚠️ **Restrição crítica:** a paleta de verde do `global.css` (`--color-green-*`) **não deve ser alterada** — é a identidade visual da marca.

### 5.1 Arquitetura de Dois Níveis

O sistema de tokens tem duas camadas:

1. **Primitivos** — valores brutos da paleta (ex.: `--color-green-700: #4d9d24`).
2. **Semânticos** — apontam para primitivos e descrevem intenção (ex.: `--btn-primary-bg: var(--color-green-700)`).

Componentes consomem os **semânticos**, nunca os primitivos diretamente. Trocar `--btn-primary-bg` muda todos os botões primários de uma vez.

### 5.2 Paleta de Cores (primitivos)

| Família                     | Escala         | Uso                                              |
| ---------------------------- | -------------- | ------------------------------------------------ |
| `--color-green-50..900`    | verde da marca | Botões primários, status de sucesso, destaques |
| `--color-blue-50..900`     | azul           | Informações, links                             |
| `--color-neutral-0..950`   | cinzas         | Texto, superfícies, bordas                      |
| `--color-semantic-error`   | `#b91c1c`    | Erros                                            |
| `--color-semantic-warning` | `#d97706`    | Avisos                                           |
| `--color-semantic-success` | `#2d5016`    | Sucesso                                          |
| `--color-semantic-info`    | `#1e40af`    | Informação                                     |

### 5.3 Tokens Semânticos

| Categoria    | Exemplos                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Superfícies | `--surface-page`, `--surface-primary`, `--surface-secondary`, `--surface-elevated`                     |
| Texto        | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-link`, `--text-accent`              |
| Botões      | `--btn-primary-bg`, `--btn-primary-bg-hover`, `--btn-secondary-*`, `--btn-ghost-*`, `--btn-danger-*` |
| Inputs       | `--input-bg`, `--input-border-color-focus`, `--input-radius`, `--input-placeholder`                    |
| Cards        | `--card-bg`, `--card-radius-desktop`, `--card-padding-desktop`                                           |
| Status       | `--status-success-bg/text`, `--status-error-bg/text`, `--status-warning-*`, `--status-info-*`          |
| Foco         | `--focus-outline-color`, `--focus-outline-width`, `--focus-outline-offset`                               |

### 5.4 Espaçamento, Radius e Tipografia

- **Espaçamento:** múltiplos de 4px — `--spacing-1` (4px) a `--spacing-16` (64px).
- **Border radius:** `--border-radius-sm` (4px) a `--border-radius-2xl` (24px) + `--border-radius-full` (9999px, pílulas/avatares).
- **Tamanho de fonte:** `--font-size-xs` (12px) a `--font-size-4xl` (36px).
- **Altura de linha:** `--line-height-tight/normal/relaxed`.

### 5.5 Classes Utilitárias Globais

Além dos tokens, `global.css` define classes reutilizáveis usadas fora dos CSS Modules:

- **Botões:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`
- **Badges:** `.badge` + `.badge-success/warning/error/info/neutral` (usado em Auditoria)
- **Pílulas/abas:** `.pill-group`, `.pill-btn`, `.pill-btn-active` (usado nas abas da Auditoria)
- **Avatares:** `.avatar`, `.avatar-sm/md/lg`
- **Outros:** `.card`, `.empty-state`, `.loading-state`, `.truncate`, `.table-base`, `.focus-ring`

### 5.6 CSS Modules

Cada componente/página tem seu `*.module.css`. A importação gera um objeto com nomes de classe únicos:

```jsx
import styles from './Usuarios.module.css';
<div className={styles.container}>
```

Classes dinâmicas a partir de chave de string aparecem em vários lugares:

```jsx
// Risco: se a chave não existir em styles, vira undefined
className={`${styles.badge} ${styles[`badge_${variant}`]}`}
```

### 5.7 Estilos Globais de Estado

`global.css` força o visual de **botões e inputs desabilitados** com `!important` (fundo cinza, cursor `not-allowed`), garantindo consistência mesmo quando um componente esquece de estilizar `:disabled`. Inputs usam **borda reservada transparente** que só ganha cor no foco (`--input-border-color-focus`).

---

## 6. Roteamento e Controle de Acesso (RBAC)

Arquivos: **`src/App.jsx`** + **`src/router/routes.jsx`**

### 6.1 Padrão de Montagem (dupla camada)

`useRoutes` só funciona dentro de um `<Router>`. Por isso o `App.jsx` usa dois componentes:

```jsx
function App() {
  const element = useRoutes(routes); // converte array → elemento
  return element;
}

function AppWrapper() {
  // exportado e usado no main.jsx
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* dentro do Router para usar hooks de navegação */}
        <App />
      </AuthProvider>
    </Router>
  );
}
```

### 6.2 Árvore de Rotas

```
routes
├── PublicLayout              ← moldura pública
│   └── "/"  → <Login />
│
└── PrivateRoute              ← guarda: exige login + role ≥ 1
    └── AdminLayout           ← moldura com Aside + Topbar + <Outlet/>
        ├── "/painel"      → <Painel />     (Admin + Dev)
        ├── "/usuarios"       → <Usuarios />      (Admin + Dev)
        ├── "/caronas"        → <Caronas />       (Admin + Dev)
        ├── "/sugestoes"      → <Sugestoes />     (Admin + Dev)
        ├── "/relatorios"     → <Relatorios />    (Admin + Dev)
        ├── "/contratos"      → <Contratos />     (Admin + Dev)
        │
        └── DevRoute          ← guarda secundária: exige role === 2
            ├── "/cadastrar"      → <Instituicoes />
            ├── "/cadastrar/novo" → <Cadastrar />
            ├── "/auditoria"      → <Auditoria />
            └── "/suporte"        → <Suporte />
```

### 6.3 Guardas de Rota

**`PrivateRoute`** — porteiro das páginas internas:

| Estado                               | Comportamento                                                        |
| ------------------------------------ | -------------------------------------------------------------------- |
| `loading === true`                 | Mostra placeholder "Carregando..." (não redireciona prematuramente) |
| `!isAuthenticated` ou `role < 1` | `<Navigate to="/" replace />` (volta ao Login)                     |
| `role >= 1`                        | `<Outlet />` (libera a página filha)                              |

**`DevRoute`** — guarda secundária aninhada (já assume autenticado):

| Estado     | Comportamento                         |
| ---------- | ------------------------------------- |
| `!isDev` | `<Navigate to="/painel" replace />` |
| `isDev`  | `<Outlet />`                        |

> **Importante:** o `DevRoute` protege contra acesso direto via URL. Mesmo que o item do menu fique oculto para o Admin, digitar `/auditoria` na barra cai aqui e é redirecionado. O backend reforça o RBAC independentemente (defesa em profundidade).

### 6.4 Navegação e Query Params

- **`NavLink`** (no Aside) detecta a rota ativa via `className={({isActive}) => ...}`.
- **`useNavigate`** para navegação programática (ex.: pós-login, logout).
- **`useSearchParams`** para o padrão `?id=N` — várias páginas (Usuarios, Caronas, Sugestoes) abrem automaticamente um item quando navegadas do Painel. Após consumir, limpam o param com `setSearchParams({}, { replace: true })`.

> **Carga estática:** todas as rotas usam imports estáticos (vão no bundle principal). Não há lazy loading de rotas — oportunidade de otimização futura (ver §28).

---

## 7. Contexto Global (AuthContext)

Arquivo: **`src/context/AuthContext.jsx`**

O **único** contexto global do projeto. Decisão correta para o tamanho da aplicação — só a autenticação é verdadeiramente global; o resto é estado de servidor local a cada página.

### 7.1 Valor Exposto

| Propriedade/Método        | Tipo              | Descrição                                                   |
| -------------------------- | ----------------- | ------------------------------------------------------------- |
| `user`                   | `object \| null` | Perfil do usuário autenticado (objeto da API)                |
| `loading`                | `boolean`       | `true` enquanto valida o token salvo no boot                |
| `isAuthenticated`        | `boolean`       | Atalho `!!user`                                             |
| `role`                   | `number`        | `0/1/2` derivado de `per_tipo`                            |
| `isAdmin`                | `boolean`       | `role === 1`                                                |
| `isDev`                  | `boolean`       | `role === 2`                                                |
| `login(email, password)` | `async fn`      | Autentica + valida papel; lança Error com mensagem amigável |
| `logout()`               | `async fn`      | Encerra a sessão local + invalida no backend                 |

### 7.2 Padrão createContext / Provider / Hook

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /* ... value ... */
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth() deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
```

O `throw` no `useAuth` falha cedo se algum componente esquecer de envolver a árvore com o Provider.

### 7.3 Hidratação no Boot

Ao montar, o Provider verifica se há `access_token` salvo:

1. Sem token → `loading = false`, segue como deslogado.
2. Com token → chama `api.getMe()`:
   - Sucesso → `setUser(me)`.
   - Falha → `tokens.clear()` (token inválido/expirado sem refresh válido).
3. `loading = false` ao final.

Usa flag `cancelled` no cleanup para evitar `setState` após desmontar (segurança no StrictMode, que monta o componente duas vezes em dev).

### 7.4 Sincronização com o http.js (pub-sub)

O Provider escuta o evento global `auth:logout`:

```jsx
useEffect(() => {
  const handler = () => setUser(null);
  window.addEventListener("auth:logout", handler);
  return () => window.removeEventListener("auth:logout", handler);
}, []);
```

Quando o `http.js` detecta um refresh falho, ele dispara `window.dispatchEvent(new CustomEvent('auth:logout'))`. Esse padrão **evita acoplamento circular** — o `http.js` não precisa importar o `AuthContext`.

### 7.5 Validação de Papel no Login

```jsx
const login = useCallback(async (email, password) => {
  await api.login(email, password);
  const me = await api.getMe();
  const role = Number(me?.per_tipo ?? 0);
  if (role < 1) {
    await api.logout().catch(() => {}); // derruba a sessão recém-criada
    throw new Error(NO_ADMIN_ACCESS_MSG); // usuário comum bloqueado
  }
  setUser(me);
  return me;
}, []);
```

`login` e `logout` usam `useCallback` para estabilidade de referência.

---

## 8. Autenticação e Sessão

Serviço: **`services/api.js`** (métodos de auth) + **`services/http.js`** (tokens e refresh)

### 8.1 Tokens JWT

Dois tokens guardados no **localStorage** via o helper `tokens` (em `http.js`):

| Chave (localStorage) | Conteúdo                                |
| -------------------- | ---------------------------------------- |
| `auth_token`       | JWT de acesso (`access_token`)         |
| `refresh_token`    | Token de renovação (`refresh_token`) |

```js
export const tokens = {
  get() {
    return {
      access: localStorage.getItem("auth_token"),
      refresh: localStorage.getItem("refresh_token"),
    };
  },
  set({ access, refresh }) {
    /* grava ambos */
  },
  clear() {
    /* remove ambos */
  },
};
```

### 8.2 Fluxo de Login

```
api.login(email, senha)
  → POST /api/usuarios/login { usu_email, usu_senha }  (auth: false)
  → salva access_token + refresh_token via tokens.set()
AuthContext: api.getMe() → GET /api/usuarios/me
  → valida per_tipo ≥ 1 (senão derruba a sessão e bloqueia)
  → setUser(me)
```

### 8.3 Recuperação de Senha (4 etapas)

A tela de Login (`Login.jsx`) tem uma máquina de estados `forgotStep` (1→2→3→4):

| Etapa                     | Ação                                       | Endpoint                                            |
| ------------------------- | -------------------------------------------- | --------------------------------------------------- |
| 1 — E-mail               | `api.forgotPassword(email)`                | `POST /api/usuarios/forgot-password`              |
| 2 — OTP (6 dígitos)     | `api.verificarOtpReset(email, otp)`        | `POST /api/usuarios/reset-password/verificar-otp` |
| 3 — Nova senha (mín. 8) | `api.resetPassword(email, otp, novaSenha)` | `POST /api/usuarios/reset-password`               |
| 4 — Sucesso              | Auto-redireciona ao login após 2,5s         | —                                                  |

Detalhes da UI de OTP: 6 inputs individuais (`otpRefs.current[i]`), auto-foco ao digitar, backspace volta ao anterior, colar (paste) distribui os dígitos. O OTP expira em 15 minutos.

> **Prevenção de enumeração de e-mail:** `forgotPassword` sempre retorna sucesso, independentemente de o e-mail existir — não revela quais e-mails estão cadastrados.

### 8.4 Renovação Automática de Token (Refresh)

Implementado em `http.js`, transparente para o resto da app:

```
Requisição autenticada → 401
  → refreshTokens()
     → POST /api/usuarios/refresh { refresh_token }
     → sucesso: salva novo par de tokens → retenta a requisição original (_retry = true)
     → falha:   tokens.clear() + dispatchEvent('auth:logout') → AuthContext desloga
```

**Controle de concorrência:** a variável `refreshInflight` garante que múltiplas requisições que recebem 401 ao mesmo tempo compartilhem **um único** refresh — as demais aguardam a mesma Promise. A flag `_retry` impede loop infinito (uma requisição só é retentada uma vez).

### 8.5 Logout

```js
async logout() {
  try { await http.post('/api/usuarios/logout'); }
  catch { /* best-effort: o objetivo prioritário é encerrar a sessão local */ }
  tokens.clear();
}
```

O backend é notificado para invalidar o refresh token, mas mesmo se a chamada falhar (rede caída), a sessão local é sempre encerrada.

> **localStorage × cookie HttpOnly:** o projeto usa localStorage por simplicidade. Cookies HttpOnly seriam mais resistentes a XSS, mas exigiriam ajustes de CORS/CSRF no backend. Trade-off documentado para evolução futura.

---

## 9. Camada de API (http.js + api.js)

### 9.1 Arquitetura em Duas Camadas

**`services/http.js` — camada "burra"** (não conhece endpoints):

- Lê `VITE_API_URL` do `.env` (fallback: `http://172.16.0.102:3000`, IP de rede local — **errado para produção**).
- Injeta `Authorization: Bearer <access_token>` quando `auth !== false`.
- Trata `FormData` (remove `Content-Type` para o browser definir o boundary).
- Faz refresh único em 401 e dispara `auth:logout` quando o refresh falha.
- Lança `ApiError` (com `status` e `body`) e sanitiza mensagens (ver §16).
- Expõe atalhos: `http.get/post/put/patch/del`.

```js
const data = await http.get("/api/admin/usuarios", { query: { page, limit } });
await http.post("/api/admin/penalidades", { usu_id, pen_tipo });
```

**`services/api.js` — camada "inteligente"** (conhece os endpoints):

- Um método por operação (`login`, `getMe`, `getUsers`, `getStats`, `applyPenalidade`...).
- Normaliza respostas (ex.: `getMe` achata `{ user }` → `user`).
- Gerencia o `statsCache` (TTL 5 min).

### 9.2 Detalhes Importantes do fetch

- `fetch` **não rejeita** em 4xx/5xx — `http.js` checa `res.ok` manualmente.
- 204 No Content → retorna `null`.
- Tenta `JSON.parse`; se falhar (ex.: CSV bruto de relatório), retorna o texto puro.

### 9.3 Cache de Estatísticas

```js
const statsCache = {};
const STATS_TTL_MS = 5 * 60 * 1000; // 5 minutos
```

`api.getStats(type)` sem filtros usa o cache de 5 min (evita refetch ao navegar Painel ↔ Relatórios). **Com filtros** (ex.: período, escola), faz bypass do cache e envia os params como query string.

### 9.4 Mapa de Métodos do `api.js`

| Grupo       | Métodos                                                                                                                                                                  | Endpoints (base)                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Auth        | `login`, `getMe`, `logout`, `forgotPassword`, `verificarOtpReset`, `resetPassword`                                                                            | `/api/usuarios/*`                                                             |
| Suporte     | `getMinhaThreadSuporte`, `enviarMensagemSuporte`, `getConversasSuporte`, `getThreadSuporte`, `responderSuporte`, `getNaoLidasSuporte`, `marcarLidasSuporte` | `/api/admin/suporte/*`, `/api/dev/suporte/*`                                |
| Stats       | `getStats(type, params)`                                                                                                                                                | `/api/admin/stats/{usuarios,caronas,sugestoes}`                               |
| Escolas     | `getSchools`, `createSchool`, `updateSchool`, `deleteSchool`, `getMyContract`, `createContract`, `uploadContractFile`, `uploadOcrTemplate`                | `/api/dev/escolas/*`, `/api/admin/contrato`                                 |
| Usuários   | `getUsers`, `getUser`, `updateUserStatus`, `updateUser`, `createUser`, `updateUserProfile`, `searchUsers`                                                   | `/api/admin/usuarios/*`, `/api/dev/*`, `/api/usuarios/:id`                |
| Caronas     | `getCaronas`, `getCaronaResumo`                                                                                                                                       | `/api/admin/caronas`, `/api/caronas/:id/resumo`                             |
| Sugestões  | `getSugestoes`, `analisarSugestao`, `responderSugestao`, `arquivarSugestao`, `desarquivarSugestao`, `deleteSugestao`                                          | `/api/sugestoes/*`                                                            |
| Denúncias  | `getDenuncias`, `analisarDenuncia`, `responderDenuncia`, `arquivarDenuncia`, `desarquivarDenuncia`, `deleteDenuncia`                                          | `/api/denuncias/*`                                                            |
| Auditoria   | `getLogs`, `exportLogs`                                                                                                                                               | `/api/dev/logs`, `/api/dev/logs/exportar`                                   |
| Penalidades | `getPenalidades`, `applyPenalidade`, `removePenalidade`                                                                                                             | `/api/admin/usuarios/:id/penalidades`, `/api/admin/penalidades/:id`         |
| Cursos      | `getCourses`, `createCourse`, `updateCourse`, `deleteCourse`                                                                                                      | `/api/infra/escolas/:id/cursos`, `/api/admin/cursos`, `/api/dev/cursos/*` |
| Geocode     | `geocodeAddress`                                                                                                                                                        | `/api/pontos/geocode` (Nominatim via backend)                                 |
| Relatórios | `downloadRelatorioCaronas`, `downloadRelatorioUsuarios`, `downloadRelatorioPenalidades`, `getRelatorioAtividade`                                                  | `/api/admin/relatorios/*`, `/api/dev/relatorios/*`                          |

> Os endpoints reais e as assinaturas detalhadas estão documentados inline em `services/api.js` — esta tabela é o índice.

---

## 10. Páginas e Funcionalidades

### 10.1 Login — `pages/Login.jsx`

Tela pública dupla: **login** + **recuperação de senha** (estado `mode: 'login' | 'forgot'`). Layout em dois painéis (hero à esquerda, formulário à direita).

- Login: e-mail + senha (toggle de visibilidade), validação no `AuthContext.login`.
- Se já autenticado, redireciona automaticamente para `/painel`.
- Recuperação: máquina de estados de 4 etapas (ver §8.3).

### 10.2 Painel — `pages/Painel.jsx`

Primeira tela após o login. Estrutura: 4 cards de métricas + gráfico de área + lista de feedbacks recentes.

**Carregamento em 3 fases** (`load` com `useCallback`):

1. **Stats (crítica):** `Promise.all` de `getStats('usuarios'/'caronas'/'sugestoes')`. Falha aqui → banner de erro.
2. **Feedbacks (tolerável):** Admin → só `getDenuncias`; Dev → `getSugestoes` + `getDenuncias` mesclados por data. Falha → seção vazia, sem derrubar o painel.
3. **Gráfico (tolerável):** `getCaronas` dos últimos 7 dias, agrupado por dia em `buildChartData`.

> **RBAC no Painel:** o Admin não acessa `/api/sugestoes` (403 — Dev only), por isso a Fase 2 bifurca por papel. Esta separação em fases evita que a restrição derrube métricas válidas.

- **Polling:** a cada 30s, pausa quando a aba está em segundo plano (`document.visibilityState`).
- **Gráfico:** `recharts` AreaChart com gradiente (`--btn-primary-bg`) e tooltip customizado.
- Clicar em um feedback navega para `/sugestoes?id=sug-N` ou `?id=den-N`.

### 10.3 Usuários — `pages/Usuarios.jsx`

Lista paginada de usuários com busca, ações por linha e dois painéis laterais.

- **Busca com debounce de 400ms** (`searchTerm` → `debouncedSearch`); reseta para página 1.
- **Paginação:** `PAGE_SIZE = 10`; `total` vem de `data.totalGeral ?? data.total`.
- **Polling:** 60s com checagem de visibilidade (`loadUsers(true)` silencioso).
- **Auto-abre perfil** via `?id=N` (navegado de Caronas/Sugestões).
- **Ações por linha** (`UserActionsMenu`): Ver / Editar / Penalizar / Desativar-Reativar.
  - **RBAC:** o botão de ativar/desativar status só é exposto para **Dev** (`onToggleStatus={isDev ? handleToggleStatus : undefined}`).
- **Painéis:** `UserProfilePanel` (ver/editar dados) e `PenaltyPanel` (penalidades).
- `handleUserUpdated` atualiza a linha **e** o `profilePanel.user` para o modo visualização refletir os dados recém-salvos sem refetch.

### 10.4 Caronas — `pages/Caronas.jsx`

Layout **mestre-detalhe**: lista de cards à esquerda, painel de detalhe à direita.

- **Lista minimalista:** `GET /api/admin/caronas` traz campos mínimos por carona.
- **Detalhe sob demanda:** ao selecionar uma carona, busca `GET /api/caronas/:id/resumo` (origem, destino, passageiros, veículo completo). Resultado fica em `detailCache` por `car_id` (sem refetch ao reabrir).
- `listItemToRide` normaliza o item da lista; `mergeResumo` funde o detalhe.
- `selectedRide` é um `useMemo` que combina lista + cache de detalhe.
- Filtros por status (Todos/Aberta/Em espera/Finalizada/Cancelada) via `STATUS_TO_CODE`.
- Cards de resumo (Total/Ativas/Finalizadas/Canceladas) vindos de `getStats('caronas')`.
- Clicar no motorista ou passageiro navega para `/usuarios?id=N`.

**Tradução de status** (`CARONAS.car_status`): `0=Cancelada · 1=Aberta · 2=Em espera · 3=Finalizada`.

### 10.5 Sugestões e Denúncias — `pages/Sugestoes.jsx`

Layout mestre-detalhe para moderar feedbacks do app.

- **RBAC:** Admin vê só **Denúncias** (`getDenuncias`); Dev vê **Sugestões + Denúncias** (`Promise.all`, mescladas por data).
- **Normalização:** `sugestaoToItem` e `denunciaToItem` convergem para um shape interno (IDs compostos `sug-N`/`den-N` evitam colisão).
- **Status (API):** `0=Resolvido · 1=Pendente · 2=Arquivado · 3=Em análise` (`mapStatus`).
- **Ações:** responder (fecha como Resolvido), mudar status (Em análise tem endpoint), arquivar/desarquivar, excluir (**Dev only**, soft delete).
- **Penalizar a partir de denúncia:** abre o `PenaltyPanel`. Denúncia de usuário usa `den_usu_alvo`; denúncia de carona busca o motorista via `getCaronaResumo`.
- Updates otimistas (`statusMap`, `archivedIds`) mantêm a UI fluida mesmo se a API falhar.
- **Polling:** 30s com checagem de visibilidade.

### 10.6 Relatórios — `pages/Relatorios.jsx`

Cards de relatório com estatísticas em tempo real e geração de CSV/PDF.

- **4 relatórios:** Caronas, Usuários, Penalidades, Atividade.
- **RBAC por relatório (`devOnly`):** Penalidades é Dev-only. Caronas/Atividade são Admin+Dev. Usuários é visível ao Admin (gera o PDF via `getUsers` — `/api/admin/usuarios`, filtrado por escola via JWT — em vez do endpoint Dev `/api/dev/relatorios/usuarios`).
- **Filtros aplicados** (`appliedFilters`): instituição (Dev), datas. Só entram em vigor ao clicar "Aplicar Filtros".
- **CSV:** `downloadCSV` cria Blob com BOM UTF-8 (Excel abre acentos corretamente).
- **PDF:** `jsPDF` + `jspdf-autotable` carregados via **import dinâmico** (`await import('jspdf')`) — só baixam o chunk quando o usuário clica em PDF. Cabeçalhos traduzidos por `translateHeader` (nunca expõe nomes de coluna do banco); IDs internos filtrados por `HIDDEN_COLUMNS`.
- Histórico de downloads é apenas in-session (sem endpoint de listagem).

### 10.7 Instituições — `pages/Instituicoes.jsx` (Dev only)

Lista de instituições com gestão de cursos por instituição (expansível).

- `getSchools` → lista; expandir uma instituição carrega seus cursos via `getCourses(escId)`.
- CRUD de cursos: criar (`createCourse`), editar (`updateCourse`), remover (`deleteCourse`).
- Botão "Nova Instituição" navega para `/cadastrar/novo`.
- Mensagem de sucesso vem via `location.state` (de `Cadastrar`), limpa após exibir.

### 10.8 Cadastrar Instituição — `pages/Cadastrar.jsx` (Dev only)

Wizard de **4 passos**: 1) Dados da escola · 2) Contrato (duração + datas + upload de PDF + modelo OCR) · 3) Administrador responsável · 4) Cursos.

- **Resiliência a falha:** o `esc_id` da escola criada é persistido em `sessionStorage` (`cadastrar_pendingEscId`). Se a criação do admin falhar, o usuário pode recarregar a página e retomar do passo 3 — evita escola duplicada.
- **Autocomplete de endereço:** `geocodeAddress` com debounce de 400ms.
- **Lock de submit** (`submitLockRef`) previne duplo-clique.
- Sequência crítica: criar escola → contrato → uploads → **criar admin** → cursos.

### 10.9 Contratos — `pages/Contratos.jsx`

Gestão de contratos institucionais.

- **RBAC:** Admin → `getMyContract` (só a própria escola); Dev → `getSchools` (todas).
- `getContractStatus` traduz `status_contrato` da API (ou calcula por datas): Ativo / Vencido / Pendente de Assinatura.
- **Renovação** (Dev, contratos vencidos): seletor inline de duração → `createContract`.
- **Gestão de admins por escola:** lista admins (`getUsers` filtrado por `per_tipo === 1`), adiciona novo admin (`createUser`), ativa/desativa acesso (`updateUserProfile` com `per_habilitado`) — Dev only.
- **Download/visualização de PDF:** monta a URL pública (`BASE_URL/public/contratos/...`); download via fetch → blob → `<a download>`.

### 10.10 Auditoria — `pages/Auditoria.jsx` (Dev only)

Visualizador de logs com duas abas: **Painel Admin/Dev** e **App — Usuários**.

- Separação client-side por `APP_ACOES` (ações `CARONA_*`/`SOLICITACAO_*` = app; resto = painel).
- `ACAO_LABELS` traduz códigos de ação para PT-BR; `getActionVariant` define a cor do badge.
- Filtros (ação, data início/fim) aplicados só ao clicar "Filtrar" (`appliedFilters`).
- **Paginação server-side** (20/página); a filtragem por aba é sobre a página atual.
- **Exportação:** CSV (todos os logs, `exportLogs`) e PDF (só a aba ativa, `jsPDF` lazy).

### 10.11 Suporte — `pages/Suporte.jsx` (Dev only)

Inbox de conversas de suporte (Dev responde aos admins).

- Lista de conversas (`getConversasSuporte`) à esquerda; thread à direita.
- **Padrão híbrido:** envio via **HTTP POST** (`responderSuporte` — confiável, persistido); recepção via **Socket.io** (`mensagem_suporte_recebida` — tempo real) + carga inicial via HTTP.
- Gestão de salas: `entrar_suporte`/`sair_suporte` ao trocar de conversa (`prevSelectedRef` sabe qual sala deixar).
- Marca como lidas ao abrir (`marcarLidasSuporte`).
- Separadores de data (Hoje/Ontem/data) entre mensagens de dias diferentes.

> **Lado Admin do suporte:** o admin não usa esta página. Ele usa o `SupportChatPanel` flutuante aberto pela Topbar (ver §11).

---

## 11. Componentes Reutilizáveis

### `Aside` — menu lateral

Navegação principal. Monta `allMenuSections` e filtra itens `developerOnly` conforme `isDev`. Itens Dev-only: Instituições, Auditoria, Suporte. O label de Sugestões muda por papel ("Denúncias" para Admin, "Sugestões/Denúncias" para Dev). Card do usuário expansível no rodapé + botão de logout. Responsivo (drawer em mobile via `isOpen`/`onClose`).

### `Topbar` — barra superior

Exibe título/subtítulo da página (mapa `PAGE_INFO` por pathname), menu do usuário (dropdown com logout) e botão de suporte. **Ergonomia do suporte por papel:** Admin abre o `SupportChatPanel` flutuante ali mesmo; Dev navega para `/suporte`. Badge de não lidas com polling de 15s (`getNaoLidasSuporte`). Hambúrguer (`onMenuToggle`) abre o Aside no mobile.

### `UserProfilePanel` — perfil/edição de usuário

Painel lateral em dois modos: **view** (grade de cards de informação) e **edit** (formulário). Edita nome, telefone e status; e-mail/instituição/curso são desabilitados. `enrichUser` normaliza os campos da API. Salvamento via `api.updateUser`; `onUserUpdated` reflete na lista. Badges de status e verificação (`VERIFICACAO_LABELS`). Avatar com fallback de iniciais quando a foto falha.

### `PenaltyPanel` — penalidades

Painel de tela cheia para gerenciar penalidades de um usuário. Lista o histórico (filtros Todas/Ativas/Inativas) e o formulário de nova penalidade (tipo 1-4, duração, motivo). Tipo 4 (suspensão) desabilita a duração (é permanente) e mostra aviso. `loadPenalties` é `useCallback` (evita loop no `useEffect`). Aplica via `applyPenalidade`, remove via `removePenalidade`.

### `UserActionsMenu` — menu ⋮ por linha

Menu suspenso com Ver Detalhes / Editar / Penalizar / Desativar-Reativar. Usa `position: fixed` com coordenadas de `getBoundingClientRect()` para escapar de `overflow:hidden`. Fecha ao rolar/redimensionar. A opção de status só aparece se `onToggleStatus` for fornecida (controle de RBAC pela página).

### `SupportChatPanel` — chat flutuante (lado Admin)

Painel flutuante aberto pela Topbar para o Admin conversar com o Dev. Mesmo padrão híbrido HTTP+Socket do Suporte.

### Componentes de feedback de UI

| Componente         | Papel                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `StatusBadge`    | Badge colorido a partir do rótulo de status (classe dinâmica)       |
| `Pagination`     | Anterior/Próximo + contador; prop `compact` para layouts estreitos |
| `LoadingSpinner` | Spinner com tamanho e texto opcional                                  |
| `EmptyState`     | Ícone + título + descrição + CTA opcional                         |
| `ErrorBanner`    | Card de erro (título +`onRetry`) ou inline                         |
| `FeedbackCard`   | Card de sugestão/denúncia clicável (Painel)                        |

---

## 12. Ícones

**Padrão adotado:** [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react`.

```jsx
import { IconUsers, IconCar, IconSearch } from "@tabler/icons-react";
<IconUsers size={20} />;
```

> Alguns comentários antigos no código mencionam "lucide-react" — é resíduo histórico. O padrão **real e atual** é `@tabler/icons-react` (prefixo `Icon*`). Ícone como prop usa o truque de renomear: `function InfoCard({ icon: Icon }) { return <Icon size={13} /> }`.

---

## 13. Armazenamento Local (localStorage)

O painel usa **apenas localStorage** (não há SecureStore como no app mobile — é um ambiente de navegador).

| Chave                      | Conteúdo                                                    | Definida em                              |
| -------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `auth_token`             | JWT de acesso                                                | `services/http.js` (helper `tokens`) |
| `refresh_token`          | Token de renovação                                         | `services/http.js` (helper `tokens`) |
| `cadastrar_pendingEscId` | `esc_id` da escola em cadastro incompleto (sessionStorage) | `pages/Cadastrar.jsx`                  |

**Caches em memória** (perdidos ao recarregar):

| Cache           | TTL                | Onde                                          |
| --------------- | ------------------ | --------------------------------------------- |
| `statsCache`  | 5 min              | `services/api.js` (stats sem filtro)        |
| `detailCache` | sessão da página | `pages/Caronas.jsx` (resumo por `car_id`) |

> **Segurança:** tokens em localStorage são acessíveis por JavaScript da página (risco de XSS). A `sanitizeErrorMessage` e o foco em não injetar HTML não confiável mitigam parte do risco. Migrar para cookie HttpOnly é item de backlog.

---

## 14. WebSocket e Tempo Real (Suporte)

**Biblioteca:** `socket.io-client` 4. **Hook:** `hooks/useSuporteSocket.js`.

O único uso de WebSocket no painel é o **chat de suporte**. Conecta ao namespace `/suporte`:

```js
const s = io(`${BASE_URL}/suporte`, {
  auth: { token: access }, // JWT do localStorage
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  transports: ["websocket"],
});
```

O hook retorna `{ socket, connected }` e cuida da limpeza (`s.disconnect()` no cleanup).

### Padrão Híbrido HTTP + Socket

| Direção                  | Transporte                                                 | Motivo                                             |
| -------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| **Enviar** mensagem  | HTTP POST (`responderSuporte`/`enviarMensagemSuporte`) | Confiável, persistido no banco antes do broadcast |
| **Receber** mensagem | Socket (`mensagem_suporte_recebida`)                     | Tempo real                                         |
| **Carga inicial**    | HTTP GET (`getThreadSuporte`)                            | Histórico completo                                |

### Eventos

| Evento                        | Direção           | Payload                                                 |
| ----------------------------- | ------------------- | ------------------------------------------------------- |
| `entrar_suporte`            | Cliente → Servidor | `{ admin_usu_id }` (entra na sala da conversa)        |
| `sair_suporte`              | Cliente → Servidor | `{ admin_usu_id }`                                    |
| `mensagem_suporte_recebida` | Servidor → Cliente | `{ spm_id, spm_texto, spm_remetente, spm_criada_em }` |

A mensagem recebida via socket é normalizada para `{ msg_id, texto, remetente, criado_em }` e anexada à thread.

> **Diferença Admin × Dev:** o Admin tem uma única conversa (com o Dev) e usa o painel flutuante da Topbar. O Dev tem várias conversas (uma por admin) e usa a página `/suporte` com inbox. O `prevSelectedRef` garante sair da sala anterior ao trocar de conversa.

---

## 15. Sistema de Penalidades

Implementado no backend, gerenciado pelo painel via `PenaltyPanel`. Aplicar/remover penalidade reflete **em tempo real no app do usuário** (o app escuta via socket — ver doc do app).

### Tipos de Penalidade (`pen_tipo`)

| `pen_tipo` | Restrição                                    | Severidade visual          |
| ------------ | ---------------------------------------------- | -------------------------- |
| 1            | Impedir de**oferecer** caronas           | warning (amarelo)          |
| 2            | Impedir de**solicitar** caronas          | warning (amarelo)          |
| 3            | Impedir oferecer**e** solicitar          | danger (vermelho)          |
| 4            | **Suspensão de conta** (bloqueia login) | critical (vermelho escuro) |

### Regras

- Tipos 1-3 exigem **duração** (1 semana a 6 meses); tipo 4 é **permanente** (até remoção manual).
- Tipo 4 ao ser aplicado: bloqueia o login do usuário e cancela caronas ativas (aviso exibido no painel).
- Uma penalidade está ativa se `pen_ativo` e (`pen_expira_em` no futuro ou ausente).
- Filtros do histórico: Todas / Ativas / Inativas (expiradas + removidas).

### Endpoints

| Operação | Endpoint                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------- |
| Listar     | `GET /api/admin/usuarios/:id/penalidades`                                              |
| Aplicar    | `POST /api/admin/usuarios/:id/penalidades` `{ pen_tipo, pen_duracao?, pen_motivo? }` |
| Remover    | `DELETE /api/admin/penalidades/:id`                                                    |

---

## 16. Sanitização de Erros e Feedback de UI

### 16.1 Sanitização (`http.js`)

A `sanitizeErrorMessage` impede que detalhes técnicos cheguem à UI:

- **5xx** → sempre mensagem genérica ("Erro interno do servidor..."), independentemente do conteúdo.
- **4xx com vazamento de schema** → mensagem genérica. O `SCHEMA_LEAK_RE` detecta prefixos de coluna do projeto (`usu_`, `car_`, `esc_`...), códigos MySQL (`ER_*`, `SQLSTATE`, `errno`), keywords SQL (`SELECT`, `WHERE`, `JOIN`...) e identificadores entre backticks.
- **4xx limpo** → repassa a mensagem (ex.: "Email ou senha inválidos").
- O detalhe original é sempre registrado no `console.error` para diagnóstico.

A classe `ApiError` carrega `status` e `body`, permitindo a páginas decidirem o tratamento (ex.: Auditoria detecta 403 e mostra "restrito a desenvolvedores").

### 16.2 Régua de Feedback na UI

| Mecanismo                                | Quando                                                        |
| ---------------------------------------- | ------------------------------------------------------------- |
| **ErrorBanner** (card + retry)     | Erro de carga de tela inteira (Painel, Caronas, Sugestões)   |
| **Estados inline**                 | Loading (LoadingSpinner), vazio (EmptyState), erro de seção |
| **`window.confirm` / `alert`** | Ações destrutivas (excluir, desativar) e erros pontuais     |

> **Observação:** o painel usa `window.confirm`/`alert` nativos em vários pontos (funcional, mas não alinhado ao design system). Migrar para um componente de Dialog próprio é item de backlog.

### 16.3 Padrão dos Quatro Estados

Páginas de listagem seguem o padrão: **loading → error → empty → content** com early returns:

```jsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorBanner error={error} onRetry={load} />;
// ... lista vazia → EmptyState
// ... conteúdo
```

---

## 17. Geração de Relatórios (PDF/CSV)

Usado em **Relatórios** e **Auditoria**.

### 17.1 Import Dinâmico (code-splitting)

`jsPDF` e `jspdf-autotable` são pesados. São carregados **só quando o usuário clica** em exportar PDF:

```js
const { jsPDF } = await import("jspdf");
const { autoTable } = await import("jspdf-autotable");
```

O Vite separa essas libs em um chunk próprio que não entra no bundle inicial.

### 17.2 CSV

`downloadCSV` cria um `Blob` com **BOM UTF-8** (`﻿`) para o Excel abrir acentos corretamente, gera uma object URL e dispara o download via `<a download>`.

### 17.3 Proteção de Dados no PDF

- `translateHeader` converte nomes técnicos de coluna (`car_data`, `usu_nome`) para rótulos legíveis ("Data", "Nome").
- `HIDDEN_COLUMNS` remove IDs internos (`car_id`, `usu_id`...) do PDF.
- Cabeçalho verde padronizado (`TucTuc` + data de geração) e rodapé com total + paginação.

---

## 18. Polling e Atualização de Dados

Sem WebSocket para dados de servidor (exceto suporte), o painel usa **polling com checagem de visibilidade**:

| Página                | Intervalo | Detalhe                                           |
| ---------------------- | --------- | ------------------------------------------------- |
| Painel                 | 30s       | `load(true)` silencioso                         |
| Sugestões             | 30s       | `load(true)` silencioso, mescla `archivedIds` |
| Usuários              | 60s       | `loadUsers(true)` silencioso                    |
| Topbar (badge suporte) | 15s       | `getNaoLidasSuporte`                            |

Todos pausam quando `document.visibilityState !== 'visible'` (economia de recursos quando a aba está em segundo plano). O parâmetro `silent` evita piscar o spinner durante refreshes em background.

---

## 19. Convenções do Projeto

### Código

1. **Sem hardcode de estilo** — sempre tokens de `global.css` via `var(--token)`.
2. **A paleta de verde NÃO pode ser alterada** (identidade da marca).
3. **Serviços sem estado** — `http.js`/`api.js` só fazem I/O; estado fica em contexto/página.
4. **Um único contexto global** (AuthContext) — estado de servidor é local a cada página.
5. **`useCallback`** em funções de fetch usadas como dependência de `useEffect` (evita loop).
6. **Flag `cancelled`** no cleanup de efeitos assíncronos (segurança no StrictMode).
7. **CSS Modules** por componente; classes globais utilitárias só em `global.css`.

### RBAC (em todas as camadas)

- O **menu** (Aside) oculta itens Dev-only.
- A **rota** (DevRoute) bloqueia acesso direto via URL.
- A **página** condiciona ações por `isAdmin`/`isDev`.
- O **backend** reforça tudo via JWT (defesa em profundidade — o front nunca é a única barreira).

### Ícones

- Sempre `@tabler/icons-react` (prefixo `Icon*`).

---

## 20. Regras de Negócio

### 20.1 Acesso ao Painel

- Apenas `per_tipo ≥ 1` (Admin ou Dev). Usuário comum (`per_tipo = 0`) é bloqueado no login com mensagem específica.
- O backend filtra os dados do Admin pela própria escola (via `per_escola_id` do JWT). O Dev vê tudo.

### 20.2 Escopo por Papel (resumo)

| Recurso                                            | Admin (1)             | Dev (2)                    |
| -------------------------------------------------- | --------------------- | -------------------------- |
| Painel, Usuários, Caronas, Relatórios, Contratos | ✅ (escopo da escola) | ✅ (global)                |
| Sugestões                                         | ❌ só Denúncias     | ✅ Sugestões + Denúncias |
| Instituições, Cadastrar, Auditoria, Suporte      | ❌                    | ✅                         |
| Alterar status de usuário                         | ❌                    | ✅                         |
| Relatório de Penalidades                          | ❌                    | ✅                         |
| Excluir sugestão/denúncia                        | ❌                    | ✅                         |
| Renovar contrato / gerenciar admins                | ❌                    | ✅                         |

### 20.3 Penalidades

Ver §15. Refletem no app em tempo real.

### 20.4 Status de Entidades

- **Caronas:** `0=Cancelada · 1=Aberta · 2=Em espera · 3=Finalizada`.
- **Usuários:** `usu_status 1=Ativo · 0=Inativo`; `usu_verificacao` (0/1/2/5/6/9) controla verificação.
- **Sugestões/Denúncias:** `0=Resolvido · 1=Pendente · 2=Arquivado · 3=Em análise`.
- **Soft delete** em todas as entidades críticas (rastreabilidade/LGPD).

---

## 21. Integração com o Backend (API)

O backend Express fica em `API-test/api-caronas/`. Todas as rotas têm prefixo `/api`. A `VITE_API_URL` define a base (ex.: `http://172.16.0.102:3000`).

### Rotas consumidas pelo painel (por arquivo de backend)

| Arquivo de rotas                              | Cobre                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `usuarioRoutes.js`                          | login, refresh, logout, recuperação de senha, perfil/me, atualização                       |
| `adminRoutes.js`                            | stats, usuários, penalidades, caronas, contrato, relatórios, suporte (base `/api/admin`)   |
| `devRoutes.js`                              | escolas, cursos, cadastro de admin/dev, logs de auditoria, relatórios Dev (base `/api/dev`) |
| `denunciaRoutes.js` / `sugestaoRoutes.js` | listar/analisar/responder/arquivar/excluir                                                     |
| `pontoEncontroRoutes.js`                    | geocode (`/api/pontos/geocode`)                                                              |

### Middlewares do Backend (resumo)

- **`authMiddleware`** — valida JWT, confirma conta ativa, injeta `req.user`.
- **`roleMiddleware` (`checkRole([1,2])`)** — RBAC; rejeita `per_tipo` insuficiente e `per_habilitado = 0`; injeta `per_escola_id` para o controller aplicar o escopo da escola.

> O detalhamento dos ~27 endpoints de `adminRoutes.js` está na doc do app (§23 daquele arquivo) e no próprio backend — não é replicado aqui para não envelhecer.

---

## 22. Build, Ambiente e Deploy

### Scripts (`package.json`)

| Comando             | Ação                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`     | Dev server (porta 5173, HMR)                                                    |
| `npm run build`   | Build de produção em `/dist` (minificação, tree-shaking, hashing, chunks) |
| `npm run preview` | Serve o `/dist` localmente (com fallback de SPA)                              |
| `npm run lint`    | ESLint (flat config)                                                            |

### Variáveis de Ambiente

Só variáveis com prefixo **`VITE_`** são expostas ao bundle (regra de segurança do Vite — tudo no front é público). **Nunca** coloque segredos em `VITE_*`.

| Variável        | Descrição                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Base da API. Default hardcoded `http://172.16.0.102:3000` é IP de **rede local** — em produção **defina explicitamente** uma URL HTTPS |

Lida em tempo de build via `import.meta.env.VITE_API_URL` — mudar o `.env` exige reiniciar o dev/refazer o build.

### Deploy de SPA — Fallback de Rotas

Como é uma SPA, rotas como `/usuarios` existem só no JavaScript. O servidor precisa servir `index.html` para qualquer rota desconhecida (history API fallback), senão dar F5 em `/usuarios` retorna 404:

- **Netlify:** `_redirects` com `/* /index.html 200`
- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Vercel:** trata SPA automaticamente ou via `rewrites`

### Cuidados de Produção

- Definir `VITE_API_URL` para HTTPS (o default LAN não funciona em produção).
- CORS: se a API estiver em domínio diferente, o backend precisa permitir a origem do painel.
- Mixed content: front HTTPS + API HTTP é bloqueado — ambos devem ser HTTPS.

---

## 23. Dados Mock (histórico)

A pasta `src/data/` (`mockData.js`, `supportMock.js`) **foi removida**. Durante o
desenvolvimento inicial ela continha dados fictícios em memória; hoje todas as telas
consomem a API real via `api.js` / `http.js`.

Notas históricas:

- **Gráfico do Painel:** alimentado por `getCaronas` real (`buildChartData`) — não depende de mock.
- **Notificações:** o antigo sino mockado da Topbar foi removido; a Topbar atual tem apenas suporte e logout.

> Ver [MOCK_API_INFO.md](MOCK_API_INFO.md) para o histórico completo da migração mock → API real.

---

## 24. Fluxos Detalhados

### 24.1 Login → Painel

```
Login.jsx: submit (email, senha)
  → AuthContext.login()
     → api.login() → POST /api/usuarios/login → salva tokens
     → api.getMe() → GET /api/usuarios/me → valida per_tipo ≥ 1
     → setUser(me)
  → navigate('/painel')
PrivateRoute: isAuthenticated && role ≥ 1 → <Outlet/> → AdminLayout → Painel
Painel: load() em 3 fases (stats → feedbacks → gráfico)
```

### 24.2 Aplicar Penalidade a partir de uma Denúncia

```
Sugestoes.jsx: seleciona denúncia → "Aplicar penalidade"
  → denúncia de usuário: usa den_usu_alvo direto
  → denúncia de carona:  api.getCaronaResumo(carId) → motorista_id
  → setPenaltyUser(...) → abre PenaltyPanel
PenaltyPanel: formulário (tipo, duração, motivo) → api.applyPenalidade()
  → POST /api/admin/usuarios/:id/penalidades
  → backend notifica o app do usuário em tempo real (socket)
```

### 24.3 Sessão Expirada (refresh falho)

```
qualquer api.* → http request → 401
  → refreshTokens() → POST /api/usuarios/refresh
  → falha → tokens.clear() + dispatchEvent('auth:logout')
AuthContext: handler do evento → setUser(null)
PrivateRoute: isAuthenticated === false → <Navigate to="/" /> (Login)
```

### 24.4 Cadastro de Nova Instituição (com retomada)

```
Cadastrar.jsx: wizard 4 passos
  passo 1-2: dados da escola + contrato (em memória)
  submit:
    → api.createSchool() → persistEscId em sessionStorage
    → api.createContract() + uploads (best-effort)
    → api.createUser(admin)  ← PASSO CRÍTICO
    → api.createCourse() para cada curso
  sucesso → limpa sessionStorage → navigate('/cadastrar', { state: { success } })
  falha no admin → esc_id permanece em sessionStorage → recarregar retoma do passo 3
```

---

## 25. Decisões de Implementação e Motivos

### 25.1 Evento `auth:logout` em vez de import direto

**Decisão:** `http.js` dispara um `CustomEvent` no `window` quando o refresh falha; o `AuthContext` escuta.

**Motivo:** evita acoplamento circular. Se o `http.js` importasse o `AuthContext` e vice-versa, haveria dependência circular. O pub-sub via evento desacopla as duas camadas.

### 25.2 Refresh com guard de concorrência

**Decisão:** `refreshInflight` compartilha uma única Promise de refresh entre requisições simultâneas.

**Motivo:** se 3 requisições recebem 401 ao mesmo tempo, sem o guard fariam 3 refreshes paralelos (e 2 falhariam por rotação de token). Com o guard, só um refresh acontece e os outros aguardam.

### 25.3 Sanitização de erros antes da UI

**Decisão:** suprimir 5xx e vazamentos de schema (`SCHEMA_LEAK_RE`).

**Motivo:** segurança. Mensagens cruas da API podem expor nomes de tabela/coluna ou stack traces — informação útil para um atacante. A UI vê mensagens genéricas; o console guarda o detalhe para debug.

### 25.4 Cache de stats (5 min)

**Decisão:** `statsCache` com TTL de 5 min, bypass quando há filtros.

**Motivo:** Painel e Relatórios fazem as mesmas 3 chamadas de stats. Sem cache, navegar entre eles refaria tudo. Com filtros, os dados mudam → bypass.

### 25.5 Import dinâmico do jsPDF

**Decisão:** `await import('jspdf')` só ao clicar em exportar PDF.

**Motivo:** jsPDF + autotable são pesados. Carregá-los no bundle inicial atrasaria o primeiro carregamento de quem nunca exporta PDF. O code-splitting isola num chunk sob demanda.

### 25.6 Polling com checagem de visibilidade

**Decisão:** `setInterval` + `document.visibilityState === 'visible'` em vez de WebSocket para dados.

**Motivo:** dados de gestão não exigem latência de milissegundos. Polling é mais simples que manter sockets para cada tipo de dado. A checagem de visibilidade economiza requisições quando a aba está em segundo plano.

### 25.7 Retomada de cadastro via sessionStorage

**Decisão:** persistir `esc_id` em sessionStorage entre os passos do wizard.

**Motivo:** se a criação do admin falha (passo crítico) e o usuário recarrega, sem a persistência ele recriaria a escola (duplicata). Com o `esc_id` salvo, o wizard retoma do passo 3.

### 25.8 Detalhe de carona sob demanda + cache

**Decisão:** a lista traz campos mínimos; o `/resumo` é buscado on-click e cacheado por `car_id`.

**Motivo:** buscar origem/destino/passageiros de todas as caronas na lista seria caro e desnecessário (o usuário só abre algumas). O cache local evita refetch ao reabrir a mesma carona na sessão.

---

## 26. Códigos de Erro HTTP

| Código | Significado no painel                                        |
| ------- | ------------------------------------------------------------ |
| 200     | Sucesso                                                      |
| 201     | Recurso criado                                               |
| 204     | Sucesso sem body (DELETE) —`http.js` retorna `null`     |
| 400     | Validação falhou / corpo inválido                         |
| 401     | Token ausente/inválido/expirado → dispara refresh          |
| 403     | Permissão negada (ex.: Admin tentando acessar endpoint Dev) |
| 404     | Recurso não encontrado                                      |
| 409     | Conflito (ex.: e-mail já existe)                            |
| 410     | Recurso expirado (OTP)                                       |
| 429     | Rate limit (tentativas de OTP)                               |
| 500     | Erro interno → mensagem genérica na UI                     |

---

## 27. Versionamento e Dependências

As versões exatas vivem no `package.json` (não replicadas aqui para não envelhecer). Resumo das principais:

| Dependência                              | Papel               |
| ----------------------------------------- | ------------------- |
| `react` / `react-dom` 19              | UI                  |
| `react-router` / `react-router-dom` 7 | Roteamento          |
| `vite` 8 + `@vitejs/plugin-react`     | Build/dev           |
| `@tabler/icons-react`                   | Ícones             |
| `recharts`                              | Gráficos           |
| `jspdf` + `jspdf-autotable`           | Exportação PDF    |
| `socket.io-client`                      | WebSocket (suporte) |
| `eslint` 9 + plugins                    | Lint                |

> **Node:** o Vite 8 exige Node 20.19+/22.12+. Confirme a versão local antes de buildar.

---

## 28. Roadmap e Limitações Conhecidas

| Item                                 | Status       | Observação                                                                             |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------- |
| Sem testes automatizados             | Backlog      | Vitest + React Testing Library (setup descrito em `docs/estudo/15-testes.md`)          |
| Sem TypeScript                       | Backlog      | `@types/react` presente; migração incremental possível                              |
| Rotas sem lazy loading               | Otimização | Todas as páginas no bundle inicial;`React.lazy` + `Suspense` reduziria o first load |
| `window.confirm`/`alert` nativos | UX           | Migrar para componente de Dialog do design system                                        |
| Tokens em localStorage               | Segurança   | Avaliar cookie HttpOnly (exige ajustes de CORS/CSRF no backend)                          |
| Sem Error Boundary                   | Robustez     | Um erro de render derruba a tela; adicionar boundary no App.jsx                          |
| Sem observabilidade                  | Backlog      | Só `console.error`; avaliar Sentry                                                    |
| Default `VITE_API_URL` é IP LAN   | Produção   | Definir HTTPS explícito antes de publicar                                               |

---

_Documentação técnica do Painel de Gestão Web TucTuc, mantida em sincronia com o código-fonte. Versões em `package.json`. Última revisão: 2026-06-21._
