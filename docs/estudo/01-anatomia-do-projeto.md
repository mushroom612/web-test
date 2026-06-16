# Módulo 01 — Anatomia do projeto

> **Objetivo**: entender o que acontece desde o momento em que o navegador abre a página
> até o React assumir o controle da tela. Você vai saber explicar *quem chama quem* na
> inicialização, o papel do Vite, do `index.html`, do `main.jsx` e do `App.jsx`, e o que é
> a "árvore de Providers".

**Arquivos cobertos:**
- [index.html](../../index.html)
- [src/main.jsx](../../src/main.jsx)
- [src/App.jsx](../../src/App.jsx)
- [vite.config.js](../../vite.config.js)
- [package.json](../../package.json)
- [src/router/routes.jsx](../../src/router/routes.jsx) (só de relance — detalhado no Módulo 04)

---

## 1. O panorama: o que é uma SPA com Vite

Este projeto é uma **SPA** (*Single Page Application*). O servidor entrega **uma** página
HTML quase vazia, e o JavaScript constrói toda a interface no navegador, trocando de "tela"
sem recarregar a página. Quem orquestra isso no desenvolvimento é o **Vite**.

O Vite faz dois trabalhos:
- **Servidor de desenvolvimento** (`npm run dev`): serve seu código instantaneamente e
  atualiza o navegador quando você salva um arquivo (HMR — veja a seção 6).
- **Bundler de produção** (`npm run build`): empacota tudo em arquivos otimizados em
  `/dist` (detalhado no Módulo 14).

Os scripts estão em [package.json](../../package.json#L6-L11):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

A configuração do Vite é minimalista — [vite.config.js](../../vite.config.js):

```js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

O único plugin é o `@vitejs/plugin-react`, que ensina o Vite a entender **JSX** (a sintaxe
de tags dentro do JavaScript) e ativa o **Fast Refresh** (HMR específico do React).

---

## 2. O ponto de entrada do HTML

Quando o navegador abre o app, o primeiro arquivo é o [index.html](../../index.html). Os
dois trechos que importam:

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

- A `<div id="root">` é um **contêiner vazio**. É aqui que o React vai "desenhar" tudo.
- O `<script type="module" src="/src/main.jsx">` carrega o JavaScript de entrada. O
  `type="module"` faz o navegador tratar o arquivo como **ESM** (com `import`/`export`).

Repare ([index.html](../../index.html#L7-L12)) que as fontes (Roboto, Space Grotesk) são
carregadas via `<link>` do Google Fonts, com `preconnect` para acelerar a conexão. O
`<title>Tuctuc</title>` é o nome que aparece na aba.

> Em produção, o Vite reescreve esse `<script>` para apontar para o arquivo final
> com *hash* no nome (ex.: `main-a1b2c3.js`) — assunto do Módulo 14.

---

## 3. `main.jsx`: o React assume o controle

O [main.jsx](../../src/main.jsx) é curtíssimo e faz **uma** coisa: conectar o React à
`<div id="root">`.

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Quebrando:
- `document.getElementById('root')` é uma API **do navegador** (DOM): pega aquela `<div>`.
- `createRoot(...)` (do `react-dom/client`) cria a **raiz** React naquele elemento. A
  partir daí, o React controla o que existe dentro da div.
- `.render(<App />)` manda o React desenhar o componente `<App />`.
- `<StrictMode>` é um "modo paranoico" de desenvolvimento (próxima seção).

Esta é a API moderna do React 18/19. Em projetos antigos (React 17 e antes) você veria
`ReactDOM.render(...)`, que **não existe mais** com o mesmo comportamento — fique atento a
tutoriais velhos.

### 3.1 O que é o StrictMode

O [`StrictMode`](../../src/main.jsx#L31) **não renderiza nada visível** e **some em
produção**. No desenvolvimento, ele ajuda a achar bugs: entre outras coisas, ele **monta,
desmonta e monta de novo** cada componente, e **executa funções de efeito duas vezes**.

Por isso, se você colocar um `console.log` dentro de um `useEffect`, vai vê-lo aparecer
**duas vezes** no `npm run dev` — não é bug, é o StrictMode testando se seu efeito tem
limpeza correta. Você verá isso na prática no [AuthContext](../../src/context/AuthContext.jsx#L44),
que tem `let cancelled = false` justamente para sobreviver a essa montagem dupla.

---

## 4. `App.jsx`: a raiz lógica e a árvore de Providers

O [App.jsx](../../src/App.jsx) configura o **roteamento** e os **contextos globais**. Há
uma sutileza importante aqui: existem **dois** componentes no arquivo.

```jsx
function App() {
  const element = useRoutes(routes);   // converte o array de rotas no elemento da URL atual
  return element;
}

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;
```

Por que **dois**? Porque o hook `useRoutes` **só funciona dentro** de um `<Router>`. Então:
- `AppWrapper` (o que é exportado) coloca o `<Router>` por fora.
- `App` (interno) fica **dentro** do Router e por isso pode chamar `useRoutes`.

Essa é a famosa pegadinha "*useRoutes() may be used only in the context of a `<Router>`*".

### 4.1 A "árvore de Providers"

"Provider" é um componente que **fornece** algo (estado, configuração) para todos os seus
descendentes via Context (Módulo 07). Empilhando o que vimos, a árvore de inicialização do
app é:

```
<StrictMode>                 ← só desenvolvimento (main.jsx)
  <AppWrapper>
    <Router>                 ← habilita rotas (react-router-dom) (App.jsx)
      <AuthProvider>         ← fornece usuário logado / login / logout (App.jsx)
        <App>                ← useRoutes(routes) escolhe a página da URL
          ... layout + página atual ...
```

A **ordem importa**: o `<AuthProvider>` está **dentro** do `<Router>`, então o código de
autenticação pode usar `navigate(...)` para redirecionar. E está **por fora** das páginas,
então qualquer página consegue chamar `useAuth()`. Se você invertesse a ordem, quebraria.

O `import './global.css'` no topo do [App.jsx](../../src/App.jsx#L16) carrega os estilos
globais e os **tokens de design** para o app inteiro (Módulo 02).

---

## 5. Por que essa separação de arquivos?

| Arquivo | Responsabilidade única |
| --- | --- |
| `index.html` | O "esqueleto" HTML e o ponto onde o JS entra |
| `main.jsx` | Plugar o React no DOM (uma linha que importa) |
| `App.jsx` | Montar Router + Providers + rotas |
| `router/routes.jsx` | Declarar *quais* páginas existem (Módulo 04) |

Essa divisão é **idiomática** em projetos Vite + React. A vantagem: cada arquivo tem um
motivo só para mudar. Se amanhã você trocar `localStorage` por cookies, mexe na camada de
auth, não no `main.jsx`.

### Alternativas de organização (e por que não aqui)

- **Tudo no `main.jsx`** (Router + Providers juntos): funciona em projeto minúsculo, mas
  vira bagunça rápido. Prós: menos arquivos. Contras: mistura "plugar no DOM" com "regras
  de navegação".
- **Framework full-stack (Next.js, Remix, React Router v7 em "framework mode")**: traz
  roteamento por arquivos, SSR e build integrados. Prós: menos configuração, SEO melhor.
  Contras: mais peso, e o painel é uma ferramenta **interna** atrás de login — SEO é
  irrelevante e SPA pura é mais simples de hospedar. Por isso o projeto usa React Router em
  **modo biblioteca** (`react-router-dom` puro), não em framework mode.

---

## 6. HMR (Hot Module Replacement) e Fast Refresh

Quando você salva um arquivo com `npm run dev` rodando, o Vite injeta **só o módulo
alterado** no navegador, sem recarregar a página inteira. No React, isso é o **Fast
Refresh**: ele troca o componente **preservando o estado** (o que você digitou num input
continua lá).

Há uma regra para o Fast Refresh funcionar: um arquivo deve **exportar só componentes
React**. Se ele exporta um componente *e* uma função utilitária, o Fast Refresh se confunde.
É exatamente por isso que o [AuthContext.jsx](../../src/context/AuthContext.jsx#L117) tem o
comentário:

```js
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { ... }
```

O plugin `eslint-plugin-react-refresh` (ver tabela de versões no [README](./README.md))
**avisa** sobre isso; ali, o aviso foi silenciado de propósito porque o hook está acoplado
ao Provider.

---

## 7. Como isso conversa com a API e o banco

Nesta etapa de inicialização, **quase nada** toca a rede — e isso é proposital. O único
contato indireto: ao montar, o `<AuthProvider>` dispara uma **única** chamada
`GET /api/usuarios/me` para "re-hidratar" a sessão se houver token salvo
([AuthContext.jsx](../../src/context/AuthContext.jsx#L44-L64)). É o que mantém você logado
ao recarregar a página. O detalhe fica para o Módulo 06; aqui só registre: **o boot é
barato** (no máximo uma requisição), e por isso o `PrivateRoute` mostra um simples
"Carregando..." em vez de um framework de loading
([routes.jsx](../../src/router/routes.jsx#L66-L74)).

---

## 8. Efeito em performance

- **Bundle inicial**: tudo o que `App.jsx` importa de forma estática entra no *bundle*
  principal. Hoje **todas as páginas** são importadas direto em
  [routes.jsx](../../src/router/routes.jsx#L27-L38), então o primeiro carregamento traz o
  código de **todas** as telas. Para um painel interno isso costuma ser aceitável, mas é o
  primeiro lugar onde *code-splitting* (Módulos 04 e 13) renderia ganho.
- **Fontes**: o `preconnect` no `index.html` reduz o tempo de busca das fontes. Fontes
  externas afetam o **LCP** (um dos Core Web Vitals — Módulo 13).
- **StrictMode** não afeta produção (ele é removido), então o "tudo roda duas vezes" é só
  no seu `dev`.

---

## Âncoras de leitura

1. Em [index.html](../../index.html), ache **a linha** onde o JavaScript do app é carregado
   e diga qual atributo o transforma em módulo ESM.
2. Em [App.jsx](../../src/App.jsx), explique **por que** `App` e `AppWrapper` são dois
   componentes separados. O que quebraria se você juntasse os dois?
3. Em [main.jsx](../../src/main.jsx), localize o componente que **só** existe em
   desenvolvimento e remova-o mentalmente: o que muda na tela do usuário final? (Resposta:
   nada visual.)
4. Em [vite.config.js](../../vite.config.js), descubra em qual porta o `npm run dev` sobe.
5. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), encontre o comentário
   `eslint-disable` ligado ao Fast Refresh e relacione com a seção 6 deste módulo.

---

## Para aprofundar

**Documentação oficial:**
- Vite — *Getting Started*: https://vite.dev/guide/ (PT: https://pt.vite.dev/guide/)
- React — `createRoot`: https://react.dev/reference/react-dom/client/createRoot
- React — `StrictMode`: https://react.dev/reference/react/StrictMode
- MDN — `<script type="module">`: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Modules

**Vídeos (PT-BR) — verifique a versão antes de seguir:**
- "Como iniciar um projeto REACT com VITE em 5 minutos — passo a passo" —
  https://www.youtube.com/watch?v=_Ln1keJif-0
- "React do Zero com Vite 🚀 | Instalação e Primeiro Componente!" —
  https://www.youtube.com/watch?v=iRy6AP-3luo
- Guia do Vite em português (oficial, escrito): https://pt.vite.dev/guide/

> **Ressalva**: a fonte da verdade é o código + a doc oficial. Confirme no vídeo se a versão
> do Vite é a 8.x (a do projeto) — versões antigas usavam Node mais velho e tinham telas de
> setup diferentes. Para mais conteúdo, busque no YouTube por **"Vite React do zero pt-br"**
> nos canais *Matheus Battisti – Hora de Codar* e *Rocketseat*.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é o DOM?**
<details><summary>Resposta-modelo</summary>
O DOM (*Document Object Model*) é a representação em árvore, em memória, de uma página HTML
que o navegador cria. Cada elemento (`<div>`, `<p>`…) vira um "nó" que pode ser lido e
alterado por JavaScript. No projeto, `document.getElementById('root')` no
[main.jsx](../../src/main.jsx) busca um nó do DOM para o React controlar.
</details>

**2. (Estudante) O que é uma SPA (Single Page Application)?**
<details><summary>Resposta-modelo</summary>
É uma aplicação que carrega **uma** página HTML e, a partir daí, usa JavaScript para trocar
o conteúdo/telas sem recarregar a página inteira. A navegação fica mais fluida, mas o
JavaScript precisa cuidar de roteamento, estado e (se preciso) SEO. Este painel é uma SPA:
o HTML real ([index.html](../../index.html)) tem só uma `<div id="root">`.
</details>

**3. (Júnior) Por que `useRoutes` precisa estar dentro de `<Router>` e como o projeto
resolve isso?**
<details><summary>Resposta-modelo</summary>
`useRoutes` lê o contexto de roteamento que o `<Router>` fornece (a URL atual). Sem esse
contexto acima dele na árvore, ele lança erro. O projeto resolve separando em dois
componentes ([App.jsx](../../src/App.jsx)): `AppWrapper` põe o `<Router>` por fora, e o
`App` interno (que chama `useRoutes`) fica por dentro.
</details>

**4. (Júnior) Por que efeitos rodam duas vezes em desenvolvimento e isso é um problema?**
<details><summary>Resposta-modelo</summary>
Por causa do `StrictMode`, que em dev monta/desmonta/monta os componentes para revelar
efeitos sem limpeza. Não é um problema **se** seu efeito for idempotente e tiver função de
limpeza (return). Se você, por exemplo, criar uma conexão sem fechá-la, verá duas conexões
— sinal de que falta limpeza. Some em produção.
</details>

**5. (Pleno) O carregamento inicial está trazendo o código de todas as páginas. Quando e
como você mudaria isso?**
<details><summary>Resposta-modelo</summary>
Hoje [routes.jsx](../../src/router/routes.jsx) importa todas as páginas estaticamente, então
o bundle inicial inclui todas. Em um painel interno pequeno, ok. Eu mudaria quando o bundle
inicial crescer a ponto de piorar o tempo de carga (medindo com o Lighthouse/relatório de
build do Vite). A solução é *code-splitting* por rota com `React.lazy` + `<Suspense>`,
carregando cada página sob demanda. Trade-off: ganho no LCP inicial vs. pequeno atraso na
primeira visita a cada rota (mitigável com *prefetch*). Ver Módulos 04 e 13.
</details>

**6. (Pleno) Por que escolher SPA pura (React Router em modo biblioteca) em vez de Next.js
para este produto?**
<details><summary>Resposta-modelo</summary>
É um painel administrativo **atrás de login**: não precisa de SEO nem de renderização no
servidor para indexação. SPA pura é mais simples de hospedar (arquivos estáticos + fallback
de rota) e de manter. Next.js traria SSR/SSG, roteamento por arquivos e otimizações, mas com
mais complexidade operacional e build mais pesado — custo sem benefício claro aqui. Se no
futuro o produto precisasse de páginas públicas indexáveis, reavaliaria.
</details>

**7. (Pleno) Como você garantiria que a inicialização não "pisca" a tela de login para um
usuário já autenticado?**
<details><summary>Resposta-modelo</summary>
Mantendo um estado `loading` no provider de auth enquanto a sessão é re-hidratada
([AuthContext.jsx](../../src/context/AuthContext.jsx#L40)) e fazendo o `PrivateRoute` exibir
um placeholder neutro ("Carregando...") enquanto `loading === true`, em vez de redirecionar
para `/` imediatamente ([routes.jsx](../../src/router/routes.jsx#L66-L74)). Só depois de
saber se há sessão é que se decide renderizar a página ou redirecionar. Assim evita-se o
*flash* de conteúdo errado.
</details>

---

## Desafio prático (autocontido, ~1h)

**"Boot do zero"**: crie um projeto Vite + React novo, separado deste, e reproduza a
arquitetura de inicialização que você estudou.

1. `npm create vite@latest meu-boot -- --template react` e `npm install`.
2. No `main.jsx`, mantenha `createRoot` + `<StrictMode>`.
3. Crie um `App.jsx` com **dois** componentes (`App` e `AppWrapper`) e um Provider de
   contexto fake (ex.: um `ThemeProvider` que fornece `{ tema: 'claro' }`). Exporte o
   `AppWrapper`.
4. Em qualquer componente filho, consuma o contexto e mostre o tema na tela.
5. Coloque um `console.log('efeito')` dentro de um `useEffect(() => {...}, [])` e observe-o
   aparecer **duas vezes** no dev. Depois adicione uma função de limpeza e entenda a ordem
   dos logs.

**Critério de sucesso**: a tela mostra o valor vindo do contexto; você consegue explicar,
por escrito, por que o `console.log` aparece duas vezes e o que acontece se remover o
`<StrictMode>`.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar o esqueleto inicial de um projeto Vite, explicar mensagens de erro
  de inicialização ("useRoutes may be used only in the context of a Router"), e lembrar a
  API nova (`createRoot`) vs. a antiga (`ReactDOM.render`).
- **Onde atrapalha**: a IA frequentemente devolve código de **React Router v6** (ou até v5)
  e padrões antigos de inicialização, porque há muito conteúdo velho no treino. Sempre cole
  a versão da tabela canônica no prompt e peça código compatível.
- **Decisão sua**: a **arquitetura de boot** (o que entra no Provider tree e em que ordem) é
  decisão de projeto, não de IA. Use a IA para tirar dúvidas pontuais; o desenho geral você
  valida contra o código real deste repositório.
