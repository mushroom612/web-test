# Módulo 04 — Roteamento (React Router v7)

> **Objetivo**: entender como o app decide **qual tela mostrar** para cada URL, sem recarregar
> a página; como **layouts aninhados** evitam repetir menu/topbar; como **proteger rotas** por
> login e por papel; e como ler **parâmetros de query** (`?id=5`). No fim, você saberá navegar
> por código e explicar o `<Outlet />`.

**Arquivos cobertos:**
- [src/router/routes.jsx](../../src/router/routes.jsx) — árvore de rotas + guardas
- [src/App.jsx](../../src/App.jsx) — `useRoutes` + `<Router>`
- [src/layouts/AdminLayout.jsx](../../src/layouts/AdminLayout.jsx) — layout com `<Outlet />`
- [src/layouts/PublicLayout.jsx](../../src/layouts/PublicLayout.jsx)
- [src/components/Aside.jsx](../../src/components/Aside.jsx) — `NavLink` + filtro de menu
- [src/pages/Usuarios.jsx](../../src/pages/Usuarios.jsx#L160-L170) — `useSearchParams`
- [src/pages/Caronas.jsx](../../src/pages/Caronas.jsx) — `useNavigate`

> **Versão**: o projeto usa **React Router 7** (`react-router-dom ^7.14.1`) em **modo
> biblioteca** (não framework). Boa parte da internet ainda mostra **v6** ou **v5** — a API
> de declaração de rotas difere. Veja a tabela no [README](./README.md).

---

## 1. O problema: navegar sem recarregar

Numa SPA, clicar num link **não** deve buscar uma nova página no servidor. O React Router
intercepta a navegação, atualiza a URL (via History API do navegador) e troca **só** o
componente renderizado. O resultado: navegação instantânea, estado preservado.

O projeto liga isso no [App.jsx](../../src/App.jsx):

```jsx
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { routes } from './router/routes';

function App() {
  const element = useRoutes(routes);  // escolhe o elemento conforme a URL
  return element;
}
```

`BrowserRouter` usa URLs "limpas" (`/painel`). `useRoutes(routes)` recebe um **array de
objetos de rota** e devolve o elemento certo para a URL atual. (Existe também a forma com
`<Routes>`/`<Route>` em JSX; o projeto preferiu o array — mesma engine, estilo diferente.)

---

## 2. Rotas como dados: a árvore em `routes.jsx`

Em vez de espalhar `<Route>` pelo JSX, o projeto declara as rotas como uma **estrutura de
dados** em [routes.jsx](../../src/router/routes.jsx#L124). Simplificando:

```jsx
export const routes = [
  { element: <PublicLayout />, children: [
      { path: '/', element: <Login /> },
  ]},
  { element: <PrivateRoute />, children: [
      { element: <AdminLayout />, children: [
          { path: '/painel', element: <Painel /> },
          { path: '/usuarios',  element: <Usuarios /> },
          { path: '/caronas',   element: <Caronas /> },
          // ...
          { element: <DevRoute />, children: [
              { path: '/cadastrar', element: <Instituicoes /> },
              { path: '/auditoria', element: <Auditoria /> },
              { path: '/suporte',   element: <Suporte /> },
          ]},
      ]},
  ]},
];
```

Lendo a árvore de cima para baixo: há um grupo **público** (Login) e um grupo **privado**.
O privado passa por dois "porteiros" (`PrivateRoute` e, mais fundo, `DevRoute`) e usa o
`AdminLayout` como moldura comum.

---

## 3. Layouts aninhados e o `<Outlet />`

Um **layout** é um componente que desenha a moldura (menu, topbar) e reserva um buraco para
a página atual. Esse buraco é o **`<Outlet />`**. Veja o
[AdminLayout](../../src/layouts/AdminLayout.jsx#L48-L54):

```jsx
<div className={styles.mainArea}>
  <Topbar onMenuToggle={...} />
  <main className={styles.content}>
    <Outlet />   {/* aqui entra Painel, Usuarios, Caronas... conforme a URL */}
  </main>
</div>
```

Quando a URL é `/usuarios`, o Router renderiza `AdminLayout` e substitui o `<Outlet />` por
`<Usuarios />`. Quando é `/caronas`, o mesmo `AdminLayout` permanece e só o `<Outlet />`
troca. **É isso que evita recriar o menu lateral a cada navegação** — o `Aside`/`Topbar`
ficam montados; só o conteúdo muda. O `PublicLayout` faz o mesmo, mais simples, para o Login.

---

## 4. Rotas protegidas (guardas)

O projeto tem **dois níveis** de proteção, ambos implementados como rotas "sem path" que
renderizam um `<Outlet />` **condicional**.

### `PrivateRoute` — exige login + papel ≥ 1

[routes.jsx](../../src/router/routes.jsx#L63-L81):

```jsx
function PrivateRoute() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <div>Carregando...</div>;          // ainda hidratando o token
  if (!isAuthenticated || role < 1) return <Navigate to="/" replace />;
  return <Outlet />;                                      // libera as rotas filhas
}
```

Três estados: enquanto a sessão é re-hidratada (`loading`), mostra um placeholder; se não
autenticado ou papel insuficiente, **redireciona** com `<Navigate>`; senão, libera via
`<Outlet />`. O `replace` troca a entrada no histórico (o usuário não "volta" para a tela
bloqueada com o botão *voltar*).

### `DevRoute` — exige papel === 2 (Desenvolvedor)

Aninhada **dentro** do `PrivateRoute`, então já pode assumir login feito
([routes.jsx](../../src/router/routes.jsx#L92-L96)):

```jsx
function DevRoute() {
  const { isDev } = useAuth();
  if (!isDev) return <Navigate to="/painel" replace />;
  return <Outlet />;
}
```

> **Ponto de segurança importante**: esconder o item de menu **não** protege a rota. O
> `Aside` filtra os links (seção 5), mas se um Admin digitar `/auditoria` na barra de
> endereço, é o `DevRoute` que o barra. A proteção real é a guarda de rota — e, no fim, o
> **backend** (que valida o JWT). O front é a primeira camada, não a única.

---

## 5. Navegação na UI: `NavLink`, `useNavigate`, filtro de menu

- **`NavLink`** (no [Aside.jsx](../../src/components/Aside.jsx#L237-L242)) é como um `<a>`,
  mas sabe se a rota está **ativa** e aplica classe diferente:

  ```jsx
  <NavLink to={item.path}
    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}>
  ```

- **`useNavigate`** navega **por código** (após uma ação). Em
  [Caronas.jsx](../../src/pages/Caronas.jsx) o clique num motorista leva ao perfil:
  `navigate(\`/usuarios?id=${selectedRide.driverId}\`)`. E no logout do
  [Aside.jsx](../../src/components/Aside.jsx#L76-L79): `navigate('/', { replace: true })`.

- **Filtro de menu por papel** ([Aside.jsx](../../src/components/Aside.jsx#L182-L187)): o
  array de itens é filtrado por `isDev || !item.developerOnly`, e seções vazias somem. Esse
  filtro **espelha** as guardas de rota — UI e segurança contam a mesma história.

---

## 6. Parâmetros: query string com `useSearchParams`

O projeto usa **query params** (`?id=5`) para passar contexto entre telas. Em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L160-L170), quando se chega de Caronas com
`?id=N`, a página abre o perfil daquele usuário e depois **limpa** o parâmetro:

```jsx
const [searchParams, setSearchParams] = useSearchParams();
useEffect(() => {
  const userId = searchParams.get('id');
  if (!userId) return;
  api.getUser(parseInt(userId, 10))
    .then(data => { const user = data?.usuario ?? data; if (user) setProfilePanel({ user, mode: 'view' }); })
    .catch(() => {})
    .finally(() => setSearchParams({}, { replace: true }));  // remove ?id da URL
}, [searchParams, setSearchParams]);
```

Diferença conceitual (entra no glossário):
- **Route params** (`/usuarios/:id`): o id faz parte do **caminho**; some se você remove o
  segmento. Bom para "a página DESTE recurso".
- **Query params** (`/usuarios?id=5`): pares chave-valor **opcionais** após `?`. Bons para
  filtros, ordenação e *deep-linking* opcional — que é o caso aqui.

O projeto escolheu query param porque `/usuarios` é uma **lista**; o `?id` é só uma dica
opcional de "já abre este perfil". Não existe rota `/usuarios/:id` dedicada.

---

## 7. Code-splitting e lazy loading (estado atual × melhoria)

Hoje **todas** as páginas são importadas estaticamente no topo de
[routes.jsx](../../src/router/routes.jsx#L27-L38). Resultado: o bundle inicial carrega o
código de todas as telas (Módulo 01, seção 8). Há **um** uso de carregamento sob demanda no
projeto, mas para uma **biblioteca**, não para uma rota — o `import()` dinâmico do jsPDF em
[Auditoria.jsx](../../src/pages/Auditoria.jsx#L204-L205):

```jsx
const { jsPDF } = await import('jspdf');   // só baixa o jsPDF quando o usuário exporta PDF
await import('jspdf-autotable');
```

Para dividir **por rota**, o padrão do React Router seria `React.lazy` + `<Suspense>`:

```jsx
// melhoria possível (não está no projeto hoje)
const Auditoria = React.lazy(() => import('../pages/Auditoria'));
// e envolver o <Outlet/> (ou a rota) com <Suspense fallback={<LoadingSpinner/>}>
```

Trade-off: ganha-se um bundle inicial menor (melhor LCP), ao custo de um pequeno atraso na
**primeira** visita a cada rota (mitigável com *prefetch* no hover do link). Para um painel
interno pequeno, a escolha atual (tudo junto) é defensável; conforme crescer, lazy por rota
vira a primeira otimização. Ver Módulo 13.

---

## 8. Como isso conversa com a API e o banco

O roteamento em si **não** chama a API — mas orquestra **quando** as páginas chamam:
- `PrivateRoute` depende do `AuthContext`, que faz o `GET /api/usuarios/me` no boot (Módulo 06).
- Ao montar, cada página dispara seus próprios `api.*` (ex.: `Usuarios` chama
  `api.getUsers`). Mudar de rota **monta** a página nova → novo fetch; **voltar** monta de
  novo → outro fetch (não há cache de rota nativo aqui, fora o `statsCache` do Módulo 08).
- O `?id` do `useSearchParams` vira o argumento de `api.getUser(id)` — a URL passa a carregar
  **intenção de dados**, não só de navegação.

---

## Âncoras de leitura

1. Em [routes.jsx](../../src/router/routes.jsx), desenhe (no papel) a árvore de rotas e
   marque onde cada guarda (`PrivateRoute`, `DevRoute`) entra.
2. Em [AdminLayout.jsx](../../src/layouts/AdminLayout.jsx), encontre o `<Outlet />` e diga o
   que ele vira quando a URL é `/relatorios`.
3. Em [routes.jsx](../../src/router/routes.jsx), explique por que o `DevRoute` pode
   "assumir" que o usuário já está autenticado.
4. Em [Aside.jsx](../../src/components/Aside.jsx), ache o filtro de itens por `developerOnly`
   e relacione-o com a guarda `DevRoute`.
5. Em [Usuarios.jsx](../../src/pages/Usuarios.jsx), siga o ciclo do `?id=`: quem lê, o que
   dispara e quando o parâmetro é removido da URL.

---

## Para aprofundar

**Documentação oficial:**
- React Router (v7) — *Home/Docs*: https://reactrouter.com
- React Router — *Outlet*: https://reactrouter.com/api/components/Outlet
- React Router — *useNavigate*: https://reactrouter.com/api/hooks/useNavigate
- React Router — *useSearchParams*: https://reactrouter.com/api/hooks/useSearchParams
- MDN — *History API*: https://developer.mozilla.org/pt-BR/docs/Web/API/History_API
- React — *lazy* / *Suspense*: https://react.dev/reference/react/lazy

**Vídeos (verifique a versão — precisa ser v7):**
- "React Router V7 Tutorial — Routing, Nested Routes, Data Loading, Layouts" (inglês, mas
  cobre v7): https://www.youtube.com/watch?v=h7MTWLv3xvw
- "React Router 7 Tutorial (framework mode)": https://www.youtube.com/watch?v=pw8FAg07kdo
- PT-BR: busque por **"React Router v7 português"** / **"rotas protegidas React pt-br"** nos
  canais *Matheus Battisti – Hora de Codar* e *Rocketseat*.

> **Ressalva**: muitos vídeos PT-BR ainda ensinam **v6** (`<Routes>`/`<Route>`) ou **v5**
> (`<Switch>`). A engine é compatível, mas confira: o projeto usa `useRoutes(array)`. Ignore
> tutoriais com `<Switch>` — é v5, desatualizado.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma "rota" numa aplicação web?**
<details><summary>Resposta-modelo</summary>
É a associação entre uma URL (ou caminho, ex.: `/usuarios`) e o conteúdo que deve aparecer
quando o usuário acessa essa URL. Num SPA com React Router, a rota mapeia um caminho para um
componente de página.
</details>

**2. (Estudante) O que faz o `<Outlet />`?**
<details><summary>Resposta-modelo</summary>
É um espaço reservado dentro de um layout/rota-pai onde o React Router renderiza a rota
**filha** correspondente à URL atual. No `AdminLayout`, o `<Outlet />` vira `Painel`,
`Usuarios`, etc., enquanto o menu e a topbar permanecem.
</details>

**3. (Júnior) Qual a diferença entre `<NavLink>`, `<Navigate>` e `useNavigate`?**
<details><summary>Resposta-modelo</summary>
`<NavLink>` é um link clicável que sabe se está ativo (para destacar no menu). `<Navigate>` é
um componente que **redireciona** ao ser renderizado (usado nas guardas). `useNavigate` retorna
uma função `navigate()` para redirecionar **por código**, após uma ação (ex.: depois do logout).
</details>

**4. (Júnior) Diferencie route params de query params e dê um caso de uso de cada.**
<details><summary>Resposta-modelo</summary>
Route param faz parte do caminho (`/usuarios/:id`) — bom para identificar um recurso específico.
Query param vem após `?` (`/usuarios?id=5&status=ativo`) — bom para filtros/ordenção/opcionais.
O projeto usa query (`?id=`) porque `/usuarios` é uma lista e o id é só uma dica opcional para
abrir um perfil; lê-se com `useSearchParams`.
</details>

**5. (Pleno) Esconder o link no menu é suficiente para proteger uma página? Justifique com o
projeto.**
<details><summary>Resposta-modelo</summary>
Não. Filtrar o menu ([Aside.jsx](../../src/components/Aside.jsx)) é só UX — o usuário pode
digitar a URL direto. A proteção de navegação vem das **guardas de rota** (`DevRoute`
redireciona quem não é Dev em [routes.jsx](../../src/router/routes.jsx)). E a proteção
**real** dos dados é no backend, que valida o JWT e o papel. Defesa em camadas: menu (UX) →
guarda (navegação) → API (autorização).
</details>

**6. (Pleno) Como aplicar code-splitting por rota aqui e quais métricas justificariam isso?**
<details><summary>Resposta-modelo</summary>
Trocar os imports estáticos das páginas por `React.lazy(() => import('../pages/X'))` e envolver
o `<Outlet/>`/rotas com `<Suspense fallback={...}>`. Justifica-se quando o **bundle inicial**
(visível no relatório do `vite build`) cresce a ponto de degradar LCP/TTI medidos no Lighthouse,
especialmente com rotas pesadas (ex.: telas com Recharts/jsPDF). Mitiga-se o atraso da primeira
visita com prefetch no hover. Ver Módulo 13.
</details>

**7. (Pleno) O `PrivateRoute` mostra "Carregando..." em vez de redirecionar enquanto
`loading`. Por quê isso importa e o que aconteceria sem esse estado?**
<details><summary>Resposta-modelo</summary>
Sem o estado `loading`, no primeiro render (antes do `/me` voltar) `isAuthenticated` seria
`false` e o guard redirecionaria um usuário **válido** para o login — um "flash" indevido e
possível logout aparente. Com `loading`, espera-se a re-hidratação do token antes de decidir.
É o equilíbrio entre não vazar páginas protegidas e não expulsar quem está logado. Ver Módulos
01 e 06.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Mini-roteador com guarda"**: crie um app React avulso com React Router v7.

1. Quatro rotas: `/login` (pública), `/home` e `/perfil` (privadas), `/admin` (só "admin").
2. Um `AuthFake` em estado/`localStorage` com `{ logado: bool, papel: 'user'|'admin' }` e
   botões para alternar.
3. Um `LayoutPrivado` com menu + `<Outlet />`. Um `RotaPrivada` que redireciona para `/login`
   se não logado, e um `RotaAdmin` (aninhado) que redireciona para `/home` se não for admin.
4. Em `/perfil`, leia um query param `?aba=dados` com `useSearchParams` e mostre a aba certa.
5. Faça o menu esconder o link `/admin` quando o papel não for admin — e **prove** que digitar
   `/admin` na URL ainda é barrado pela guarda.

**Critério de sucesso**: digitar URLs protegidas na barra redireciona corretamente; o link de
admin some para não-admin **e** a rota continua protegida; a aba do perfil muda conforme o
`?aba=`.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar o esqueleto da árvore de rotas, escrever guardas, lembrar a API de
  `useSearchParams`/`useNavigate` e explicar erros de contexto do Router.
- **Onde atrapalha**: é o tema onde a IA mais erra de **versão** — entrega `<Switch>` (v5) ou
  padrões de v6 que divergem do `useRoutes(array)` do projeto. Também tende a "proteger" só o
  menu e esquecer a guarda de rota, dando falsa sensação de segurança.
- **Decisão sua**: o **modelo de autorização** (quais papéis acessam o quê, e a lembrança de
  que o backend é a autoridade final) é decisão de produto/segurança. Não delegue isso à IA;
  use-a para implementar a estrutura depois de você definir as regras.
