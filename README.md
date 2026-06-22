# 📚 Tuctuc — Painel Administrativo Web

> Plataforma de administração para o aplicativo Tuctuc de caronas solidárias entre estudantes.

## 🎯 O que é este projeto?

Este é um **painel administrativo** para o aplicativo Tuctuc, onde administradores
de escola e desenvolvedores podem:

- 👥 Gerenciar usuários (e aplicar penalidades)
- 🚗 Acompanhar caronas
- 💬 Ver sugestões e denúncias
- 📊 Gerar relatórios (CSV/PDF)
- 📋 Gerenciar contratos e instituições
- 🔍 Acessar logs de auditoria
- 🛟 Conversar pelo chat de suporte (Admin ↔ Dev)

### Dois perfis de acesso

| Perfil | `per_tipo` | Escopo |
|---|---|---|
| **Administrador** de escola | 1 | Apenas dados da própria instituição (filtrado pelo backend via JWT) |
| **Desenvolvedor** | 2 | Acesso global a todas as instituições + páginas exclusivas (Instituições, Auditoria, Suporte) |

---

## 🧰 Stack

- **React 19** + **Vite 8** (SPA)
- **react-router-dom 7** — roteamento
- **@tabler/icons-react** — ícones
- **recharts** — gráfico do Painel
- **socket.io-client** — chat de suporte em tempo real
- **jspdf** + **jspdf-autotable** — exportação de PDF (ver [docs/jspdf-referencia.md](docs/jspdf-referencia.md))
- **CSS Modules** + `global.css` — estilos isolados + design system

---

## 📁 ESTRUTURA DE PASTAS

```
web-test/
├── src/
│   ├── global.css                ← cores e estilos padrão de todo o app (design system)
│   ├── main.jsx                  ← arquivo que INICIA tudo
│   ├── App.jsx                   ← monta o Router + AuthProvider
│   │
│   ├── context/
│   │   └── AuthContext.jsx       ← estado global de autenticação (usuário, papel, login/logout)
│   │
│   ├── services/                 ← camada de acesso a dados (API real)
│   │   ├── api.js                ← funções que chamam os endpoints do backend
│   │   └── http.js               ← cliente HTTP + JWT (access/refresh) e interceptor
│   │
│   ├── hooks/
│   │   └── useSuporteSocket.js   ← WebSocket (Socket.io) do chat de suporte
│   │
│   ├── components/               ← blocos reutilizáveis
│   │   ├── Aside.jsx             ← menu lateral
│   │   ├── Topbar.jsx            ← barra superior (título + suporte + logout)
│   │   ├── StatusBadge.jsx       ← rótulos coloridos de status
│   │   ├── FeedbackCard.jsx      ← card de sugestão/denúncia (Painel)
│   │   ├── PenaltyPanel.jsx      ← painel lateral de penalidades
│   │   ├── UserActionsMenu.jsx   ← menu de ações (⋮) do usuário
│   │   ├── UserProfilePanel.jsx  ← painel de perfil/edição do usuário
│   │   ├── SupportChatPanel.jsx  ← chat de suporte flutuante (Admin)
│   │   ├── LoadingSpinner.jsx / ErrorBanner.jsx / EmptyState.jsx / Pagination.jsx
│   │   └── *.module.css
│   │
│   ├── layouts/
│   │   ├── AdminLayout.jsx       ← moldura interna (Aside + Topbar + conteúdo)
│   │   └── PublicLayout.jsx      ← moldura simples (apenas Login)
│   │
│   ├── pages/                    ← as telas reais
│   │   ├── Login.jsx
│   │   ├── Painel.jsx            ← tela inicial (métricas + gráfico + feedbacks)
│   │   ├── Usuarios.jsx
│   │   ├── Caronas.jsx
│   │   ├── Sugestoes.jsx
│   │   ├── Relatorios.jsx
│   │   ├── Instituicoes.jsx      ← lista de escolas (Dev)
│   │   ├── Cadastrar.jsx         ← nova instituição (Dev)
│   │   ├── Contratos.jsx
│   │   ├── Auditoria.jsx         ← logs (Dev)
│   │   ├── Suporte.jsx           ← chat (Dev)
│   │   └── *.module.css
│   │
│   └── router/
│       └── routes.jsx            ← define qual página aparece em cada URL + guardas de rota
│
├── docs/                         ← documentação (este README aponta para cá)
│   ├── DOCUMENTACAO_PAINEL_WEB.md ← documentação técnica completa
│   ├── jspdf-referencia.md       ← referência da lib de PDF
│   ├── MOCK_API_INFO.md          ← histórico da fase mock → API real
│   ├── IMPLEMENTATION_SUMMARY.md ← resumo do sistema de penalidades
│   ├── SECURITY_BACKLOG.md       ← backlog de segurança
│   ├── DESCRICOES_DFD_WEB.md     ← descrição do DFD
│   └── estudo/                   ← trilha de estudo do projeto (16 módulos)
│
├── public/
├── package.json
├── vite.config.js
├── eslint.config.js
└── index.html
```

---

## 🎮 COMO FUNCIONA — O fluxo do aplicativo

### Ao abrir http://localhost:5173/

```
1. Browser abre index.html
2. index.html chama main.jsx
3. main.jsx chama App.jsx (que monta o Router + AuthProvider)
4. routes.jsx decide a página pela URL
5. Como a URL é "/", mostra Login.jsx
```

### Ao entrar (login válido)

```
1. Login.jsx chama api.login() → recebe os tokens JWT
2. navigate('/painel')
3. PrivateRoute confere a sessão (autenticado + papel ≥ 1)
4. AdminLayout (Aside + Topbar) envolve o conteúdo
5. Painel.jsx busca dados reais via api.js e renderiza
```

---

## 🔄 CAMADA DE DADOS — Tudo vem da API real

Todo acesso a dados passa por **`src/services/api.js`**, que por sua vez usa
**`src/services/http.js`** para falar com o backend.

```javascript
// Quando uma página precisa de dados:
1. Chama uma função em api.js          ex.: api.getUsers({ page, q })
   ↓
2. api.js usa http.js (fetch + JWT) para chamar o endpoint do backend
   ↓
3. A página recebe o JSON e exibe na tela
```

- **`http.js`** cuida do token JWT (access + refresh), anexa o cabeçalho de
  autorização e renova o token automaticamente quando expira.
- **`api.js`** expõe métodos com nomes claros (`getUsers`, `getStats`,
  `getCaronas`, `applyPenalidade`…) — as páginas não conhecem a URL nem o `fetch`.

> 📌 **Histórico:** o projeto já usou dados mockados em memória durante o
> desenvolvimento inicial. Essa fase foi concluída e os mocks foram removidos —
> ver [docs/MOCK_API_INFO.md](docs/MOCK_API_INFO.md).

---

## 📌 CONTEXTO REACT — `src/context/AuthContext.jsx`

Compartilha o estado de autenticação com toda a aplicação sem repassar props.

- **Armazena:** usuário logado (`user`), papel (`role`/`isAdmin`/`isDev`), status de login.
- **Como usar:**

  ```javascript
  import { useAuth } from "../context/AuthContext";

  function MeuComponente() {
    const { user, isAuthenticated, isDev } = useAuth();
    return <div>{user?.usu_nome}</div>;
  }
  ```

---

## 🧩 COMPONENTES principais

| Componente | O que faz |
|---|---|
| **Aside.jsx** | Menu lateral. Os itens são filtrados por papel (Dev vê itens extras). |
| **Topbar.jsx** | Barra superior: título da página, botão de suporte e logout. |
| **StatusBadge.jsx** | Rótulos coloridos de status (Ativo, Pendente, etc.). |
| **FeedbackCard.jsx** | Card clicável de sugestão/denúncia (usado no Painel). |
| **UserActionsMenu.jsx** | Menu ⋮ de cada usuário (Ver, Editar, Penalizar). |
| **PenaltyPanel.jsx** | Painel lateral para aplicar/listar/remover penalidades (ver abaixo). |
| **UserProfilePanel.jsx** | Painel de perfil e edição do usuário. |
| **SupportChatPanel.jsx** | Chat de suporte flutuante (lado do Admin). |

---

## 🗂️ LAYOUTS — `src/layouts/`

#### AdminLayout.jsx — com barra lateral + header

```
┌─────────────────────────────────┐
│      TOPBAR (header)            │
├──────────┬──────────────────────┤
│  ASIDE   │   CONTEÚDO DA PÁGINA │
│  (menu)  │      (<Outlet/>)     │
└──────────┴──────────────────────┘
```

#### PublicLayout.jsx — sem barra lateral (só Login)

```
┌──────────────────────────────┐
│   CONTEÚDO CENTRALIZADO       │
│        (LOGIN)               │
└──────────────────────────────┘
```

---

## 📄 PÁGINAS — `src/pages/`

| Página | URL | Acesso | Descrição |
|---|---|---|---|
| **Login.jsx** | `/` | Público | Tela de login |
| **Painel.jsx** | `/painel` | Admin + Dev | Métricas + gráfico + feedbacks recentes |
| **Usuarios.jsx** | `/usuarios` | Admin + Dev | Lista de usuários + penalidades |
| **Caronas.jsx** | `/caronas` | Admin + Dev | Registros de carona |
| **Sugestoes.jsx** | `/sugestoes` | Admin + Dev | Sugestões (Dev) e denúncias (Admin) |
| **Relatorios.jsx** | `/relatorios` | Admin + Dev | Relatórios (CSV/PDF) |
| **Contratos.jsx** | `/contratos` | Admin + Dev | Contratos das instituições |
| **Instituicoes.jsx** | `/cadastrar` | Dev | Lista de escolas |
| **Cadastrar.jsx** | `/cadastrar/novo` | Dev | Cadastro de nova instituição |
| **Auditoria.jsx** | `/auditoria` | Dev | Log de ações (painel + app) |
| **Suporte.jsx** | `/suporte` | Dev | Chat de suporte com os admins |

> O acesso é controlado em `routes.jsx` por `PrivateRoute` (papel ≥ 1) e
> `DevRoute` (papel = 2). O backend ainda restringe os dados por escola para Admins.

---

## 🎨 CORES E ESTILOS — `src/global.css`

Concentra as **variáveis de cor e estilo** de todo o app.

```css
--color-green-700: #4e8726;  /* verde principal (botões) */
--color-green-100: #e9f5df;  /* verde claro (fundos) */
--surface-page:    #ececec;  /* cor de fundo */
--text-primary:    #171717;  /* cor do texto */
```

Para alterar uma cor, mude o valor da variável em `global.css` — todas as telas
se atualizam.

---

## 🔀 ROTEAMENTO — `src/router/routes.jsx`

```javascript
{ path: '/painel',   element: <Painel /> }     // "/painel" mostra o Painel
{ path: '/usuarios', element: <Usuarios /> }   // "/usuarios" mostra Usuarios
```

**Adicionar uma página nova:**

1. Crie `src/pages/MinhaPage.jsx`
2. Importe em `routes.jsx`: `import { MinhaPage } from "../pages/MinhaPage";`
3. Adicione a rota: `{ path: '/minha-pagina', element: <MinhaPage /> }`

---

## 📋 CSS MODULES

Cada `.jsx` tem um `.module.css` correspondente (ex.: `Painel.jsx` ↔ `Painel.module.css`),
o que isola os estilos e evita conflito de nomes entre telas.

---

## 🛡️ SISTEMA DE PENALIDADES

Permite penalizar usuários infratores a partir da página **Usuários**.

### Como usar

1. Vá para **Usuários** (`/usuarios`)
2. Clique no ícone **⋮** em uma linha
3. Selecione **Penalizar** → abre o **PenaltyPanel** (painel lateral)
4. Escolha **tipo**, **duração** e **motivo** → **Aplicar**

### Tipos disponíveis

| Tipo | Descrição |
|---|---|
| Impedimento de oferecer | Usuário não pode oferecer caronas |
| Impedimento de solicitar | Usuário não pode solicitar caronas |
| Impedimento duplo | Não pode oferecer nem solicitar |
| Suspensão de conta | Acesso suspenso (permanente; bloqueia o login) |

> Detalhes da implementação em [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md).
> A operação é integrada à API (`api.applyPenalidade` / `getPenalidades` / `removePenalidade`).

---

## ⚙️ Variáveis de ambiente

O endereço do backend é configurado por variável de ambiente (arquivo `.env` na raiz):

```
VITE_API_URL=http://localhost:3000
```

Uso no código: `import.meta.env.VITE_API_URL`.

---

## ▶️ Como rodar

```bash
npm install      # instalar dependências
npm run dev      # servidor de desenvolvimento → http://localhost:5173/
npm run build    # build de produção
npm run lint     # checagem de lint
```

---

## 🐛 Debug

- **Console do navegador (F12 → Console):** erros de runtime em vermelho.
- **Terminal do `npm run dev`:** erros de build/Vite.
- **Network (F12):** requisições à API (status, tempo, payload).

---

## ❓ DÚVIDAS FREQUENTES

**P: Onde mudo o texto "Tuctuc"?**
R: Em `src/components/Aside.jsx`.

**P: Como adiciono um item no menu lateral?**
R: Em `src/components/Aside.jsx`, no array de seções do menu.

**P: De onde vêm os dados das telas?**
R: Da API real, sempre via `src/services/api.js` (que usa `src/services/http.js`).

**P: Qual a senha do login?**
R: As credenciais são validadas pelo backend real (JWT). Use um usuário válido
cadastrado no banco com papel de Admin (1) ou Desenvolvedor (2).

**P: Será possível trocar o backend?**
R: Sim — como tudo passa por `api.js`/`http.js`, basta ajustar a `VITE_API_URL`
e, se necessário, os endpoints em `api.js`. As telas não mudam.

---

## 📦 Dependências principais

- **React 19** — biblioteca de UI
- **React Router DOM 7** — roteamento
- **Vite 8** — build tool e dev server
- **@tabler/icons-react** — ícones SVG
- **recharts** — gráficos
- **socket.io-client** — WebSocket (chat de suporte)
- **jspdf / jspdf-autotable** — exportação de PDF

---

## 📚 Referências

- [Documentação técnica completa](docs/DOCUMENTACAO_PAINEL_WEB.md)
- [Trilha de estudo (docs/estudo)](docs/estudo/README.md)
- [React](https://react.dev) · [React Router](https://reactrouter.com) · [Vite](https://vitejs.dev) · [Tabler Icons](https://tabler.io/icons)

---

## ✨ Estado do projeto

- ✅ Login integrado com API real (JWT + refresh token)
- ✅ Painel com métricas e gráfico (dados reais)
- ✅ Usuários + sistema de penalidades
- ✅ Caronas, Sugestões/Denúncias, Relatórios, Contratos, Instituições
- ✅ Auditoria
- ✅ Chat de suporte Admin ↔ Dev em tempo real (Socket.io)
- ✅ Responsividade (mobile/tablet/desktop)
- ✅ Integração com API real (concluída)

---

**Desenvolvido com React 19 + Vite + React Router + Tabler Icons + Socket.io-client**

Versão: 1.2 | Último update: Junho 2026
