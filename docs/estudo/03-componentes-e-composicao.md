# Módulo 03 — Componentes e composição

> **Objetivo**: dominar a unidade básica do React — o **componente** — e as ferramentas para
> combiná-los: **props**, **JSX**, **hooks** (`useState`, `useEffect`), **`children`** e
> **componentes controlados**. Tudo ancorado nos componentes pequenos e reutilizáveis do
> projeto, que são ótimos exemplos por serem curtos.

**Arquivos cobertos:**
- [src/components/StatusBadge.jsx](../../src/components/StatusBadge.jsx)
- [src/components/Pagination.jsx](../../src/components/Pagination.jsx)
- [src/components/LoadingSpinner.jsx](../../src/components/LoadingSpinner.jsx)
- [src/components/EmptyState.jsx](../../src/components/EmptyState.jsx)
- [src/components/ErrorBanner.jsx](../../src/components/ErrorBanner.jsx)
- [src/components/FeedbackCard.jsx](../../src/components/FeedbackCard.jsx)
- [src/context/AuthContext.jsx](../../src/context/AuthContext.jsx#L33) (exemplo de `children`)
- [src/pages/Usuarios.jsx](../../src/pages/Usuarios.jsx) (componente controlado + estado)

---

## 1. O que é um componente

No React, um componente é **uma função** que recebe um objeto de **props** e devolve
**JSX** (a descrição da UI). Por convenção, o nome começa com **letra maiúscula**. O menor
exemplo do projeto é o [LoadingSpinner](../../src/components/LoadingSpinner.jsx):

```jsx
export function LoadingSpinner({ size = 28, text }) {
  return (
    <div className={styles.wrapper}>
      <IconLoader2 size={size} className={styles.spin} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
```

Três ideias já aparecem aqui:
- **Props desestruturadas** com valor padrão: `{ size = 28, text }`.
- **JSX** com um ícone e um `<span>`.
- **Renderização condicional**: `{text && <span>...</span>}` — o `<span>` só aparece se
  `text` for "verdadeiro".

> Observação de versão: desde o **React 17+** você **não** precisa `import React` em todo
> arquivo (o JSX é transformado pelo plugin do Vite). Por isso os componentes do projeto
> importam só o que usam (hooks, ícones, `styles`).

---

## 2. Props: a entrada de dados de um componente

**Prop** ("propriedade") é um valor que o componente-pai passa ao filho, como um argumento.
Props são **somente leitura**: o filho não altera as props que recebe.

Veja o [Pagination](../../src/components/Pagination.jsx#L14): ele recebe vários props,
inclusive **callbacks** (funções) e valores com padrão:

```jsx
export function Pagination({ page, totalPages, total, itemLabel = 'item',
                             onPrevious, onNext, compact = false }) { ... }
```

E como o pai o usa (em [Usuarios.jsx](../../src/pages/Usuarios.jsx#L319-L326)):

```jsx
<Pagination
  page={page}
  totalPages={totalPages}
  total={total}
  itemLabel="usuário"
  onPrevious={() => setPage(p => Math.max(1, p - 1))}
  onNext={() => setPage(p => Math.min(totalPages, p + 1))}
/>
```

Repare que `onPrevious`/`onNext` são **funções** passadas como prop. O filho não sabe o que
elas fazem — só as **chama** no clique. Isso é **inversão de controle**: o componente de
paginação é genérico; quem decide a ação é o pai.

### 2.1 Padrões de props que o projeto usa

- **Prop que é um componente** (passar um ícone). No
  [EmptyState](../../src/components/EmptyState.jsx#L10) há o truque de renomear na
  desestruturação para virar maiúscula (JSX exige maiúscula para componentes):

  ```jsx
  export function EmptyState({ icon: Icon, title, description, action }) {
    return <div> {Icon && <Icon size={40} />} ... </div>;
  }
  ```

  `icon: Icon` significa "pegue a prop `icon` e chame-a localmente de `Icon`". Assim
  `<Icon />` funciona como tag.

- **Prop que é um objeto** (agrupar dados). O
  [FeedbackCard](../../src/components/FeedbackCard.jsx#L39) recebe `feedback` (um objeto com
  `userName`, `date`, `type`, `text`) e um `onClick` opcional.

- **Prop opcional com efeito visual**. Em FeedbackCard, a classe `cardClickable` só é
  aplicada **se** houver `onClick`:

  ```jsx
  className={`${styles.card} ${onClick ? styles.cardClickable : ""}`}
  ```

---

## 3. JSX por dentro

JSX **parece** HTML, mas é açúcar sintático para chamadas de função que criam elementos
React. Diferenças que pegam iniciantes:

| HTML | JSX | Porquê |
| --- | --- | --- |
| `class` | `className` | `class` é palavra reservada do JS |
| `onclick="..."` | `onClick={fn}` | eventos em camelCase recebem **funções**, não strings |
| `for` (label) | `htmlFor` | idem `class` |
| `style="color:red"` | `style={{ color: 'red' }}` | recebe um **objeto** JS |

No JSX, `{ ... }` "abre uma janela" para JavaScript. Você pode interpolar valores
(`{feedback.userName}`), expressões (`{page} de {totalPages}`) e renderização condicional.

### 3.1 Renderização condicional e listas

- **`&&`** mostra algo só se a condição for verdadeira:
  `{notifCount > 0 && <span className={styles.badge}>{notifCount}</span>}`
  ([Topbar.jsx](../../src/components/Topbar.jsx)).
- **Ternário** escolhe entre dois. O [ErrorBanner](../../src/components/ErrorBanner.jsx) tem
  **dois modos** decididos por props: se houver `title`/`onRetry`, renderiza um card; senão,
  um banner inline.
- **`.map()`** transforma um array em uma lista de elementos. Em
  [Usuarios.jsx](../../src/pages/Usuarios.jsx#L263) cada usuário vira uma `<tr>`. Aqui entra
  a regra do **`key`**: cada item da lista precisa de uma prop `key` única (ali,
  `key={user.usu_id}`) para o React reconciliar a lista com eficiência.

> Cuidado com o `&&`: se a condição for um **número 0**, o React renderiza o `0` na tela
> (porque `0` não é booleano). Por isso usa-se `total !== 1 ? 's' : ''` e checagens
> explícitas em vez de `algumLista.length && <Lista/>` quando `length` pode ser 0.

---

## 4. Hooks: estado e efeitos

**Hook** é uma função especial do React (sempre começa com `use`) que dá "superpoderes" a um
componente de função. Os dois fundamentais:

### `useState` — memória do componente

Guarda um valor que, quando muda, **re-renderiza** o componente. Em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L116-L121):

```jsx
const [searchTerm, setSearchTerm] = useState('');  // [valor atual, função que atualiza]
const [page, setPage] = useState(1);
const [users, setUsers] = useState([]);
```

`useState` retorna um par: o valor e a função para alterá-lo. Chamar `setPage(2)` agenda um
novo render com `page === 2`.

### `useEffect` — sincronizar com o "mundo externo"

Roda código **depois** do render, para efeitos colaterais: buscar dados, assinar eventos,
mexer no DOM. Tem um **array de dependências** que controla quando re-executa. Em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L146):

```jsx
useEffect(() => { loadUsers(); }, [loadUsers]);
```

Roda quando `loadUsers` muda (e `loadUsers` muda quando `page` muda — ver Módulo 13). Se o
efeito **assina** algo, ele deve **limpar** no `return`. Veja o polling em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L149-L154):

```jsx
useEffect(() => {
  const id = setInterval(() => { if (document.visibilityState === 'visible') loadUsers(true); }, 60_000);
  return () => clearInterval(id);   // limpeza: evita timers duplicados
}, [loadUsers]);
```

> **Rules of Hooks** (regras inquebráveis): chame hooks **sempre no topo** do componente,
> **nunca** dentro de `if`/loop/função aninhada, e **só** em componentes ou em outros hooks.
> O `eslint-plugin-react-hooks` (ver [README](./README.md)) vigia isso.

Outros hooks usados no projeto: `useCallback` e `useMemo` (Módulo 13), `useRef`
([Topbar.jsx](../../src/components/Topbar.jsx) para detectar clique fora), `useContext`
(Módulo 07), e os de roteamento `useNavigate`/`useSearchParams` (Módulo 04).

---

## 5. `children`: composição por aninhamento

A prop especial **`children`** é "o que você colocou entre as tags de abertura e fechamento"
do componente. É a base da **composição**. O exemplo mais claro é o
[AuthProvider](../../src/context/AuthContext.jsx#L33):

```jsx
export function AuthProvider({ children }) {
  // ...
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

E no [App.jsx](../../src/App.jsx#L58-L60) ele "abraça" a aplicação:

```jsx
<AuthProvider>
  <App />          {/* isto é o `children` do AuthProvider */}
</AuthProvider>
```

`children` permite componentes "embrulho" (providers, layouts, modais) que não sabem
**o que** envolvem — apenas envolvem. O `<Outlet />` do React Router (Módulo 04) é uma
variação dessa ideia para rotas aninhadas.

---

## 6. Componentes controlados

Um input é **controlado** quando o React é a "fonte da verdade" do seu valor: o `value` vem
do estado e toda digitação passa por um `onChange` que atualiza esse estado. Em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L230-L236):

```jsx
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

O fluxo é circular: digito → `onChange` → `setSearchTerm` → novo render → `value` atualizado.
Vantagem: o estado sempre reflete a UI (dá para validar, formatar, desabilitar botões). O
oposto é o input **não-controlado** (valor mora no DOM, lido via `ref`) — mais raro aqui.
Aprofundamos no Módulo 09.

---

## 7. Como isso conversa com a API e o banco

Componentes de apresentação puros — `StatusBadge`, `LoadingSpinner`, `EmptyState`,
`Pagination`, `FeedbackCard` — **não falam com a API**. Eles só recebem props e desenham.
Quem busca dados são as **páginas** (`Usuarios`, `Caronas`…), que chamam o `api.*` (Módulo
05) e **passam os dados para baixo** via props. Essa separação ("componentes burros" de UI
× "páginas espertas" que buscam dados) é um padrão de arquitetura: facilita testar e
reaproveitar os componentes pequenos.

Um detalhe de contrato aparece no `StatusBadge`: ele mapeia **textos de status** já
traduzidos (ex.: `'Ativo'`, `'Cancelada'`) para cores. A tradução de **código do banco** →
texto acontece antes, na página/serviço (Módulo 08) — o badge nunca vê `usu_status === 1`.

---

## 8. Efeito em performance

- Componentes pequenos e sem estado re-renderizam barato. O cuidado real é com **listas
  grandes** e com **funções recriadas** a cada render passadas como prop (quebram
  memoização) — tema do Módulo 13.
- O padrão "página busca, componentes recebem props" concentra o estado em poucos pontos,
  reduzindo re-renders espalhados.
- `key` correta em listas evita o React recriar nós à toa. **Nunca** use o índice do array
  como `key` se a lista pode reordenar/inserir no meio — use um id estável (`usu_id`).

---

## Âncoras de leitura

1. No [EmptyState](../../src/components/EmptyState.jsx), explique a sintaxe `icon: Icon` e por
   que a maiúscula importa.
2. No [ErrorBanner](../../src/components/ErrorBanner.jsx), identifique as **duas** formas de
   render e o que decide qual aparece.
3. No [AuthContext](../../src/context/AuthContext.jsx), encontre o `children` e diga, olhando
   o [App.jsx](../../src/App.jsx), **o que** vira esse `children` na prática.
4. No [Usuarios.jsx](../../src/pages/Usuarios.jsx), ache o input de busca e prove que ele é
   **controlado** (aponte o `value` e o `onChange`).
5. No [Usuarios.jsx](../../src/pages/Usuarios.jsx), encontre o `.map()` que gera as linhas e
   diga qual é a `key` e por que ela é adequada.

---

## Para aprofundar

**Documentação oficial:**
- React — *Your First Component*: https://react.dev/learn/your-first-component
- React — *Passing Props to a Component*: https://react.dev/learn/passing-props-to-a-component
- React — *Rendering Lists* (e `key`): https://react.dev/learn/rendering-lists
- React — *State: A Component's Memory* (`useState`): https://react.dev/learn/state-a-components-memory
- React — *Synchronizing with Effects* (`useEffect`): https://react.dev/learn/synchronizing-with-effects
- React — *Passing JSX as children*: https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children

**Vídeos / cursos (PT-BR) — confira a versão:**
- "Curso COMPLETO de REACT" (verifique se é React 18/19) — busque por
  **"curso React do zero pt-br 2025"**.
- Canais: *Matheus Battisti – Hora de Codar* (playlist React), *Rocketseat* (Ignite React),
  *Fernanda Kipper | Dev* (projetos React). Termo de busca útil:
  **"props e estado React explicado pt-br"**.

> **Ressalva**: a fonte da verdade é o código + a doc oficial (react.dev/pt-br). Evite vídeos
> que ainda usem componentes de **classe** (`class extends React.Component`) como padrão
> principal — o projeto usa **funções + hooks**.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma prop?**
<details><summary>Resposta-modelo</summary>
É um dado de entrada que um componente-pai passa para um componente-filho, como argumento de
função. Props são somente leitura dentro do filho. Ex.: `<LoadingSpinner text="Carregando" />`
passa a prop `text`.
</details>

**2. (Estudante) Qual a diferença entre `class` no HTML e `className` no JSX?**
<details><summary>Resposta-modelo</summary>
São a mesma ideia (aplicar classes CSS), mas no JSX usa-se `className` porque `class` é palavra
reservada do JavaScript. O JSX também usa camelCase para eventos (`onClick`) e `htmlFor` no
lugar de `for`.
</details>

**3. (Júnior) O que é `useState` e o que acontece quando você chama a função `set`?**
<details><summary>Resposta-modelo</summary>
`useState(inicial)` cria um estado local e retorna `[valor, setValor]`. Chamar `setValor(novo)`
agenda um **re-render** do componente com o novo valor. O React não muda o valor "no lugar"; ele
re-executa a função do componente com o estado atualizado. Atualizações podem ser agrupadas
(batching).
</details>

**4. (Júnior) Por que listas precisam de `key` e por que o índice do array é uma key ruim?**
<details><summary>Resposta-modelo</summary>
A `key` ajuda o React a identificar cada item entre renders para reconciliar a lista (reusar,
mover ou remover nós) com eficiência e preservar estado interno dos itens. O índice é ruim quando
a lista pode reordenar, inserir ou remover no meio: as keys "deslizam" e o React associa o nó
errado, causando bugs de estado e re-renders desnecessários. Use um id estável (`usu_id`).
</details>

**5. (Pleno) Explique a regra de não chamar hooks condicionalmente e o que pode quebrar.**
<details><summary>Resposta-modelo</summary>
O React identifica cada hook pela **ordem** de chamada em cada render. Se um hook ficar dentro de
um `if`, a ordem muda entre renders e o React passa a associar estado/efeito ao hook errado,
corrompendo valores. Por isso hooks vão sempre no topo, incondicionalmente; condicione o **valor**
ou o **conteúdo** do efeito, não a chamada. O `eslint-plugin-react-hooks` detecta violações.
</details>

**6. (Pleno) Quais armadilhas o `&&` em JSX pode causar e como evitá-las?**
<details><summary>Resposta-modelo</summary>
`{valor && <Comp/>}` renderiza `valor` quando ele é "falsy mas exibível", como `0` ou `NaN` —
aparece um `0` solto na tela. Evita-se com checagens explícitas (`valor > 0 && ...`,
`Boolean(valor) && ...` ou ternário). Também atenção a strings vazias e a confundir `&&` com
lógica de fallback (aí usa-se `??` ou ternário).
</details>

**7. (Pleno) Como você decidiria dividir uma página grande em componentes? Que critérios usa?**
<details><summary>Resposta-modelo</summary>
Critérios: (1) **reuso** — repetiu em 2+ lugares, extraio (ex.: `StatusBadge`, `Pagination`);
(2) **responsabilidade única** — separo "buscar dados" (página) de "apresentar" (componentes
burros); (3) **fronteira de re-render** — isolo partes caras para memoizar; (4) **legibilidade**
— se um trecho de JSX precisa de comentário para se entender, vira componente nomeado. Evito
super-fragmentar cedo (abstração prematura). Ver como o projeto mantém componentes de UI
pequenos e páginas como orquestradoras.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Kit de UI reutilizável"**: num projeto React avulso, recrie três componentes burros
inspirados nos do projeto, usando **dados fake**.

1. `Badge({ status })` — recebe um texto e pinta com cor por status (mapa de cores +
   fallback), como o [StatusBadge](../../src/components/StatusBadge.jsx).
2. `EmptyState({ icon, title, action })` — aceita um **ícone como prop** e um `action`
   opcional `{ label, onClick }`, como o [EmptyState](../../src/components/EmptyState.jsx).
3. `Pagination({ page, totalPages, onPrev, onNext })` — botões que **desabilitam** nos
   extremos e chamam callbacks do pai.
4. Monte uma telinha que use os três com um array fake e um `useState` de página.

**Critério de sucesso**: os três componentes não têm estado próprio de dados (só recebem
props), o `Pagination` desabilita corretamente nos limites, e trocar o array fake muda a UI
sem editar os componentes.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar componentes burros repetitivos, sugerir a assinatura de props,
  converter HTML em JSX e explicar mensagens das Rules of Hooks.
- **Onde atrapalha**: a IA às vezes inventa estado interno desnecessário, usa **índice como
  key**, esquece a função de limpeza de `useEffect`, ou mistura busca de dados dentro de um
  componente que deveria ser de apresentação.
- **Decisão sua**: o **desenho da fronteira de componentes** (o que é página vs. componente
  burro, onde mora o estado) é arquitetura — decida você. Use a IA para preencher a
  implementação depois que a fronteira estiver clara.
