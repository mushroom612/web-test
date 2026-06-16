# Módulo 07 — Estado global (Context API)

> **Objetivo**: entender o que é "estado global", por que ele existe, e como o projeto o
> implementa **só** com a **Context API** do React — sem Redux nem Zustand. Você vai saber
> explicar *prop drilling*, quando usar contexto, e os cuidados de performance que ele exige.

**Arquivos cobertos:**
- [src/context/AuthContext.jsx](../../src/context/AuthContext.jsx) — o único contexto global
- [src/App.jsx](../../src/App.jsx#L53-L63) — onde o Provider entra na árvore
- Consumidores: [Aside.jsx](../../src/components/Aside.jsx#L70), [Topbar.jsx](../../src/components/Topbar.jsx), [routes.jsx](../../src/router/routes.jsx#L64), [Login.jsx](../../src/pages/Login.jsx#L28)

---

## 1. O problema: prop drilling

Estado **local** (`useState` num componente) resolve a maioria dos casos. Mas alguns dados
são precisos em **muitos** lugares distantes na árvore — por exemplo, **quem é o usuário
logado**. O `Aside`, a `Topbar`, as guardas de rota e o `Login` precisam dele.

Sem contexto, você passaria `user` por props de pai para filho, atravessando componentes que
nem usam o dado — o **prop drilling**. É verboso, frágil e acopla componentes intermediários
a dados que não são deles.

**Context API** resolve: um `Provider` "publica" um valor no alto da árvore e qualquer
descendente "assina" via `useContext`, sem props intermediárias.

---

## 2. Anatomia de um contexto no projeto

O [AuthContext.jsx](../../src/context/AuthContext.jsx) é o exemplo canônico. Três peças:

**a) Criar o contexto** ([linha 26](../../src/context/AuthContext.jsx#L26)):
```js
const AuthContext = createContext(null);
```

**b) O Provider** ([linha 33](../../src/context/AuthContext.jsx#L33)) — guarda o estado e
expõe um `value`:
```jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... login, logout, hidratação ...
  const value = { user, loading, isAuthenticated: !!user, role, isAdmin, isDev, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**c) O hook de consumo** ([linha 118](../../src/context/AuthContext.jsx#L118)) — atalho com
checagem de erro:
```jsx
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
```

O `useAuth` faz duas coisas valiosas: esconde o `useContext(AuthContext)` (o consumidor não
precisa importar o objeto de contexto) e **falha cedo** com mensagem clara se alguém usar o
hook fora do Provider. Isso transforma um bug silencioso (`ctx` é `null`) em um erro óbvio.

---

## 3. Onde o Provider entra (e por que ali)

No [App.jsx](../../src/App.jsx#L53-L63), o `AuthProvider` envolve as rotas, **dentro** do
`<Router>`:

```jsx
<Router>
  <AuthProvider>
    <App />   {/* todas as rotas/páginas: podem chamar useAuth() */}
  </AuthProvider>
</Router>
```

A posição não é arbitrária (revisão do Módulo 01): **dentro** do Router para poder usar
`navigate`, e **acima** das páginas para que todas leiam a sessão. Tudo que está abaixo do
Provider pode chamar `useAuth()`; o que está acima, não.

---

## 4. Como os consumidores usam

Cada consumidor pega **só o que precisa** por desestruturação:

- [routes.jsx](../../src/router/routes.jsx#L64): `const { isAuthenticated, loading, role } = useAuth();`
- [Aside.jsx](../../src/components/Aside.jsx#L70): `const { user, isDev, isAdmin, logout } = useAuth();`
- [Login.jsx](../../src/pages/Login.jsx#L28): `const { login, isAuthenticated, loading } = useAuth();`

Repare que o contexto expõe tanto **dados** (`user`, `role`) quanto **ações** (`login`,
`logout`). Centralizar as ações junto do estado que elas modificam é o que torna o contexto a
**única fonte de verdade** da sessão.

---

## 5. O cuidado de performance com Context

A regra de ouro: **quando o `value` do Provider muda, todos os componentes que consomem aquele
contexto re-renderizam** — mesmo que usem só um pedaço do valor.

No `AuthContext` isso é tranquilo porque o `value` muda **raramente** (login, logout, fim de
hidratação). Mas em contextos que mudam **com frequência** (ex.: a cada tecla, a cada scroll),
isso vira um problema de performance: tudo que assina re-renderiza junto.

Mitigações (úteis de conhecer, mesmo que aqui não sejam necessárias):
- **Separar contextos**: um para dados que mudam muito, outro para os estáveis.
- **Memoizar o `value`** com `useMemo` para não recriar o objeto a cada render do Provider.
- **`useCallback`** nas funções expostas (o projeto já faz: `login`/`logout` são
  `useCallback` em [AuthContext.jsx](../../src/context/AuthContext.jsx#L77)).

> Detalhe: hoje o objeto `value` é recriado a cada render do `AuthProvider`. Como o Provider
> re-renderiza pouco, o impacto é nulo. Em um contexto "quente", você envolveria o `value` em
> `useMemo([...deps])`. Ver Módulo 13.

---

## 6. Alternativas de gerenciamento de estado

| Solução | Quando brilha | Custo | No projeto |
| --- | --- | --- | --- |
| **`useState`/`useReducer` local** | Estado de um componente/tela | Nenhum | Usado em todas as páginas |
| **Context API** (escolhido p/ global) | Poucos dados globais, que mudam pouco (sessão, tema, idioma) | Re-render de todos os consumidores quando o value muda | `AuthContext` |
| **Zustand** | Estado global frequente, com seletores finos (assina só um pedaço) | +dependência (pequena) | Não usado |
| **Redux Toolkit** | Apps grandes, fluxo previsível, devtools, middleware | Boilerplate, curva | Não usado |
| **Jotai/Recoil** | Estado atômico, derivações | +conceitos | Não usado |
| **React Query** | Estado **de servidor** (cache de dados remotos) | Curva | Não usado (ver Módulo 05) |

A decisão do projeto é correta para o tamanho: **só a sessão é verdadeiramente global**, e ela
muda pouco — Context API é o suficiente e evita dependências. Um erro comum é cair direto no
Redux "porque sim"; aqui isso seria peso morto.

> Distinção que vale ouro em entrevista: **estado de servidor** (dados que vêm da API, como a
> lista de usuários) é diferente de **estado de cliente** (sessão, tema, abas abertas). Context
> é ótimo para estado de cliente global; para estado de servidor, a ferramenta ideal é React
> Query — não Redux nem Context.

---

## 7. Como isso conversa com a API e o banco

O `AuthContext` é o **único** ponto do app que transforma chamadas de API de sessão
(`api.login`, `api.getMe`, `api.logout`) em **estado React** consumível. As páginas não
guardam "quem está logado" — elas perguntam ao contexto. Os **outros** dados (usuários,
caronas, logs) **não** ficam em contexto: cada página os busca localmente com `useState` +
`useEffect` (Módulo 05). Essa é uma decisão consciente — colocar listas de dados em contexto
global misturaria estado de servidor com estado de cliente e geraria re-renders amplos.

---

## Âncoras de leitura

1. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), identifique as **três** peças:
   `createContext`, o `Provider` e o hook `useAuth`.
2. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), liste tudo que o `value` expõe e
   classifique cada item em **dado** ou **ação**.
3. Em [Aside.jsx](../../src/components/Aside.jsx), veja quais campos do contexto são
   desestruturados e onde cada um é usado.
4. Explique, olhando o [App.jsx](../../src/App.jsx), o que aconteceria se o `AuthProvider`
   ficasse **fora** do `<Router>`.
5. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), ache o `throw` do `useAuth` e
   explique que bug ele transforma em erro claro.

---

## Para aprofundar

**Documentação oficial:**
- React — *createContext*: https://react.dev/reference/react/createContext
- React — *useContext*: https://react.dev/reference/react/useContext
- React — *Passing Data Deeply with Context*: https://react.dev/learn/passing-data-deeply-with-context
- React — *Scaling Up with Reducer and Context*: https://react.dev/learn/scaling-up-with-reducer-and-context
- Zustand (alternativa): https://zustand.docs.pmnd.rs/

**Vídeos (PT-BR) — confira a versão:**
- "Context API React" — busque por **"Context API useContext português"**. Recurso escrito
  PT-BR: DevMedia — https://www.devmedia.com.br/react-js-passando-dados-com-context-api/42904
- Canais: *Matheus Battisti – Hora de Codar*, *Rocketseat*. Para alternativas: **"Zustand
  português"**, **"Redux Toolkit português"**.

> **Ressalva**: no React 19 há a sintaxe nova `<Context>` (sem `.Provider`) e o hook `use()`.
> O projeto usa a forma clássica `<AuthContext.Provider>` — ambas funcionam. Vídeos pré-React
> 19 mostram só a clássica; tudo bem, é a usada aqui.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é "estado" num componente React?**
<details><summary>Resposta-modelo</summary>
É um dado que o componente "lembra" entre interações e que, ao mudar, faz o componente
re-renderizar para refletir o novo valor. Criado com `useState`/`useReducer`. Ex.: o texto
digitado num campo de busca.
</details>

**2. (Estudante) O que é "prop drilling"?**
<details><summary>Resposta-modelo</summary>
É passar uma prop por vários níveis de componentes intermediários só para que ela chegue a um
componente profundo, mesmo que os intermediários não usem a prop. Vira verboso e frágil; a
Context API existe para evitar isso em dados realmente compartilhados.
</details>

**3. (Júnior) Quando você usaria Context em vez de estado local?**
<details><summary>Resposta-modelo</summary>
Quando o mesmo dado é necessário por componentes distantes na árvore e passá-lo por props seria
prop drilling — tipicamente sessão do usuário, tema, idioma. Para estado que pertence a uma só
tela (um filtro, um modal aberto), `useState` local é melhor: mantém o re-render contido.
</details>

**4. (Júnior) Por que o projeto cria o hook `useAuth` em vez de chamar `useContext` direto?**
<details><summary>Resposta-modelo</summary>
Para encapsular o `useContext(AuthContext)` (consumidores não importam o objeto de contexto),
padronizar o uso, e **falhar cedo** com erro claro se usado fora do Provider (o `throw`).
Também facilita refatorar a implementação interna sem mudar os consumidores.
</details>

**5. (Pleno) Por que Context pode causar problemas de performance e como mitigá-los?**
<details><summary>Resposta-modelo</summary>
Porque qualquer mudança no `value` do Provider re-renderiza **todos** os consumidores, mesmo os
que usam outro pedaço do valor. Em contextos que mudam muito, isso é caro. Mitigações: dividir
em múltiplos contextos por frequência de mudança; memoizar o `value` com `useMemo` e as funções
com `useCallback`; ou usar uma lib com seletores (Zustand) que assina só a fatia usada. No
`AuthContext` não é problema porque o value muda raramente.
</details>

**6. (Pleno) Diferencie "estado de cliente" de "estado de servidor" e diga a ferramenta certa
para cada.**
<details><summary>Resposta-modelo</summary>
Estado de cliente é dado que nasce e vive no front (sessão, tema, UI) — Context/useState/Zustand
servem bem. Estado de servidor é dado remoto que o front **espelha** (listas, detalhes) e que
precisa de cache, revalidação, dedupe e sincronização — a ferramenta ideal é React Query/SWR,
não Context nem Redux. Misturar os dois (jogar listas da API em Context global) gera re-renders
amplos e cache caseiro frágil.
</details>

**7. (Pleno) O projeto cresceu: 8 contextos globais aninhados ("provider hell"). Como você
organizaria?**
<details><summary>Resposta-modelo</summary>
Opções: (1) compor os providers num único componente `AppProviders({children})` para achatar o
JSX; (2) reavaliar se cada contexto é mesmo global — muitos podem virar estado local ou de
servidor (React Query); (3) para estado global frequente, migrar para Zustand com seletores,
reduzindo re-renders e aninhamento; (4) separar contextos por domínio e frequência de mudança.
O objetivo é minimizar re-renders e manter cada estado na camada certa, não empilhar Providers.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"ThemeContext do zero"**: app React avulso com um contexto de tema global.

1. Crie `ThemeContext` com `createContext`, um `ThemeProvider` que guarda `tema` ('claro' |
   'escuro') e expõe `toggleTheme`, e um hook `useTheme` que lança erro se usado fora do
   Provider.
2. Persista o tema no `localStorage` e re-hidrate no boot.
3. Tenha **dois** componentes distantes na árvore que consomem o contexto: um botão de toggle e
   um cabeçalho que mostra o tema atual — **sem** passar props entre eles.
4. **Bônus**: adicione um `console.log` em cada consumidor e observe quem re-renderiza quando o
   tema muda. Depois memoize o `value` com `useMemo` e comente o efeito.

**Critério de sucesso**: trocar o tema atualiza ambos os componentes sem prop drilling; o tema
persiste após reload; você consegue explicar quem re-renderiza e por quê.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar o trio createContext/Provider/hook, sugerir o `value` e escrever o
  `useMemo`/`useCallback` de memoização.
- **Onde atrapalha**: a IA tende a **superusar** Context (joga tudo, inclusive dados de
  servidor, no global) ou pula direto para Redux sem necessidade. Também esquece de memoizar o
  `value` em contextos quentes e de tratar o caso "fora do Provider".
- **Decisão sua**: **o que merece ser global** é decisão de arquitetura. Pergunte-se sempre "é
  estado de cliente ou de servidor?" e "isso muda com que frequência?". A resposta define a
  ferramenta — e essa escolha é sua, não da IA.
