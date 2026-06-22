# Módulo 13 — Performance

> **Objetivo**: aprender a raciocinar sobre desempenho de uma app React: o que causa
> **re-renders**, como `useCallback`/`useMemo`/`memo` ajudam (e quando atrapalham),
> **code-splitting** com `import()` dinâmico, tamanho de **bundle**, cache de dados, e os
> **Core Web Vitals**. Tudo ancorado em decisões reais do projeto.

**Arquivos cobertos:**
- [src/pages/Caronas.jsx](../../src/pages/Caronas.jsx#L168-L245) — `useCallback` + `useMemo` + caches
- [src/pages/Auditoria.jsx](../../src/pages/Auditoria.jsx#L200-L234) — `import()` dinâmico (jsPDF)
- [src/services/api.js](../../src/services/api.js#L16-L173) — `statsCache`
- [src/pages/Usuarios.jsx](../../src/pages/Usuarios.jsx#L133-L154) — `useCallback` + polling visível
- [src/router/routes.jsx](../../src/router/routes.jsx#L27-L38) — imports estáticos (oportunidade de lazy)

---

## 1. O modelo mental: o que dispara um re-render

Um componente React re-renderiza quando:
1. Seu **estado** muda (`useState`/`useReducer`).
2. Suas **props** mudam.
3. Seu **componente-pai** re-renderiza (por padrão, filhos re-renderizam junto).
4. Um **contexto** que ele consome muda o `value` (Módulo 07).

Re-render **não** é, por si só, ruim — o React é rápido. O problema é re-render **caro**
(listas grandes, cálculos pesados) ou **em cascata** desnecessária. A regra: **meça antes de
otimizar**. Otimização prematura adiciona complexidade sem ganho.

---

## 2. `useCallback`: estabilizar funções

Toda render recria as funções declaradas no componente. Geralmente tudo bem — mas se a função
é **dependência** de um `useEffect` ou prop de um filho memoizado, recriá-la dispara efeitos/
renders à toa. `useCallback` memoiza a função, recriando-a só quando as dependências mudam.

No [Usuarios.jsx](../../src/pages/Usuarios.jsx#L133-L146):

```jsx
const loadUsers = useCallback(async (silent = false) => {
  // ... busca usuários da página `page` ...
}, [page]);                              // recria só quando `page` muda

useEffect(() => { loadUsers(); }, [loadUsers]);   // re-busca quando loadUsers muda
```

A cadeia é elegante: `loadUsers` só muda quando `page` muda; o `useEffect` depende de
`loadUsers`; logo, **trocar de página re-busca** automaticamente, e nada mais dispara o
efeito. Mesmo padrão em [Caronas.jsx](../../src/pages/Caronas.jsx#L168-L196), onde `load`
depende de `[page, filterStatus]` — mudar página **ou** filtro recarrega.

> Pegadinha de versão: se você esquecer uma dependência, o `eslint-plugin-react-hooks` avisa
> ("exhaustive-deps"). Há um `eslint-disable` consciente em
> [SupportChatPanel.jsx](../../src/components/SupportChatPanel.jsx#L115) — desabilitar a regra é
> aceitável **quando você entende** a consequência, não para silenciar preguiça.

---

## 3. `useMemo`: memoizar cálculos derivados

`useMemo` guarda o **resultado** de um cálculo e só o refaz quando as dependências mudam. No
[Caronas.jsx](../../src/pages/Caronas.jsx#L239-L245), `selectedRide` combina a lista com o
cache de detalhe:

```jsx
const selectedRide = useMemo(() => {
  if (selectedId == null) return null;
  const base = rides.find(r => r.id === selectedId);
  if (!base) return null;
  const resumo = detailCache[selectedId];
  return resumo ? mergeResumo(base, resumo) : base;
}, [selectedId, rides, detailCache]);
```

Sem `useMemo`, o `find` + `mergeResumo` rodariam **a cada render** (inclusive a cada tecla em
outro estado da página). Com ele, só recalcula quando `selectedId`, `rides` ou `detailCache`
mudam. Aqui o ganho é real porque `mergeResumo` faz trabalho (varre `pontos`, monta strings) e
o resultado é usado em vários pontos do JSX.

> **Quando NÃO usar**: para cálculos triviais (somar dois números, formatar uma string curta),
> `useMemo` custa mais (memória + comparação de deps) do que economiza. Use para trabalho
> perceptível ou para estabilizar referências passadas a filhos memoizados.

---

## 4. `React.memo`: evitar re-render de filhos

`memo` envolve um componente para que ele **só** re-renderize se suas props mudarem (comparação
rasa). O projeto **não** usa `memo` hoje — e tudo bem: os componentes de UI são leves e as
listas, paginadas (15 itens em Caronas, 10 em Usuarios). `memo` brilha quando:
- O componente é **caro** de renderizar.
- Ele recebe as **mesmas props** com frequência enquanto o pai re-renderiza por outro motivo.

`memo` só funciona se as props forem **estáveis** — daí a sinergia com `useCallback`/`useMemo`
(funções/objetos memoizados). Aplicar `memo` com props que mudam de referência a cada render é
inútil (a comparação sempre falha).

---

## 5. Caches: não ir à rede à toa

Performance não é só render — **rede** pesa muito. O projeto tem dois caches caseiros:

- **`statsCache`** ([api.js](../../src/services/api.js#L16-L173)): TTL de 5 min para
  estatísticas. Painel e Relatórios pedem os mesmos números; o segundo pega do cache. Filtros
  fazem *bypass* (sempre buscam).
- **`detailCache`** por `car_id` ([Caronas.jsx](../../src/pages/Caronas.jsx#L159-L234)): ao
  reabrir uma carona já vista, o `/resumo` **não** é refeito.

Ambos evitam requisições redundantes. É exatamente o que uma lib como **React Query** faria
automaticamente (com invalidação, dedupe e revalidação) — aqui é feito à mão, de forma
intencional e contida (Módulos 05 e 08).

Outro cuidado de rede: o polling de Usuarios só roda com a **aba visível**
([Usuarios.jsx](../../src/pages/Usuarios.jsx#L149-L154)): `if (document.visibilityState ===
'visible')`. Não desperdiça requisições em abas de fundo.

---

## 6. Code-splitting e tamanho de bundle

O **bundle** é o JavaScript que o navegador baixa. Quanto maior, pior o tempo até a página ficar
interativa. Duas frentes no projeto:

### Já feito: `import()` dinâmico de biblioteca pesada

O jsPDF (+ autotable) é grande e só serve para **exportar PDF**. Em vez de incluí-lo no bundle
inicial, o [Auditoria.jsx](../../src/pages/Auditoria.jsx#L204-L205) o carrega **sob demanda**:

```jsx
async function handleExportPdf() {
  const { jsPDF } = await import('jspdf');   // baixado só no primeiro clique em "Exportar PDF"
  await import('jspdf-autotable');
  // ...
}
```

Quem nunca exporta PDF nunca baixa esse código. O Vite cria um *chunk* separado automaticamente
para esse `import()`. **Esse é o padrão de ouro** para libs pesadas e de uso eventual.

### Oportunidade: lazy por rota

Hoje [routes.jsx](../../src/router/routes.jsx#L27-L38) importa **todas** as páginas
estaticamente — o bundle inicial traz o código de todas as telas, incluindo as pesadas (Recharts
no Painel/Relatórios). A melhoria seria `React.lazy` + `<Suspense>` por rota (Módulo 04,
seção 7). Para decidir, olhe o **relatório do `vite build`** (lista os chunks e tamanhos) e o
Lighthouse: se o bundle inicial estiver grande e telas como Relatórios forem pouco acessadas,
lazy compensa.

---

## 7. Core Web Vitals (e como medir)

Os **Core Web Vitals** são as métricas do Google para experiência real:

| Métrica | Mede | Bom (limiar) | O que afeta no projeto |
| --- | --- | --- | --- |
| **LCP** (Largest Contentful Paint) | Tempo até o maior conteúdo aparecer | < 2,5s | Tamanho do bundle, fontes externas |
| **INP** (Interaction to Next Paint) | Resposta à interação | < 200ms | Re-renders caros, JS na thread |
| **CLS** (Cumulative Layout Shift) | Estabilidade visual (pulos) | < 0,1 | Loading sem reservar espaço, imagens sem dimensão |

Como medir: **Lighthouse** (DevTools → aba Lighthouse), a aba **Performance** do DevTools, e o
**React DevTools Profiler** (para ver quais componentes re-renderizam e quanto custam). Regra de
ouro: **perfile primeiro, otimize o que aparece**. Suposições sobre performance costumam errar.

Detalhes do projeto que tocam CWV:
- **Fontes** com `preconnect` no [index.html](../../index.html#L7-L8) ajudam o LCP.
- **Feedback local** (spinners por seção, Módulo 12) reduz CLS vs. trocar a tela inteira.
- **StrictMode** roda efeitos 2× em dev — isso é só desenvolvimento; não afeta as métricas de
  produção (Módulo 01).

---

## 8. Como isso conversa com a API e o banco

Performance de front e contrato de back se cruzam:
- **Paginação** (`PAGE_SIZE` em todas as listas) limita o volume por requisição — menos dado na
  rede e menos nós no DOM.
- A **API de caronas dividida** (lista magra + `/resumo` sob demanda) é uma decisão de
  performance de rede: não traz passageiros/pontos de **todas** as caronas de uma vez (Módulo
  08). O custo é uma segunda chamada ao abrir o detalhe — mitigada pelo `detailCache`.
- **`Promise.all`** em [Caronas.jsx](../../src/pages/Caronas.jsx#L173-L176) dispara stats + lista
  em **paralelo**, não em série — metade do tempo de espera.

---

## Âncoras de leitura

1. Em [Caronas.jsx](../../src/pages/Caronas.jsx), explique por que `load` está em `useCallback` e
   o que dispara um novo carregamento.
2. Em [Caronas.jsx](../../src/pages/Caronas.jsx), descreva o trabalho que o `useMemo` de
   `selectedRide` evita repetir.
3. Em [Auditoria.jsx](../../src/pages/Auditoria.jsx), ache o `import()` dinâmico e explique o
   ganho de bundle para quem nunca exporta PDF.
4. Em [api.js](../../src/services/api.js), siga o `statsCache`: quando serve do cache e quando faz
   bypass.
5. Em [Caronas.jsx](../../src/pages/Caronas.jsx), encontre o `Promise.all` e diga por que ele é
   melhor que dois `await` em sequência.

---

## Para aprofundar

**Documentação oficial:**
- React — *useCallback*: https://react.dev/reference/react/useCallback
- React — *useMemo*: https://react.dev/reference/react/useMemo
- React — *memo*: https://react.dev/reference/react/memo
- React — *lazy* / *Suspense*: https://react.dev/reference/react/lazy
- Vite — *Build / code splitting*: https://vite.dev/guide/features.html#dynamic-import
- web.dev — *Core Web Vitals*: https://web.dev/articles/vitals
- MDN — *Page Visibility API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Page_Visibility_API

**Vídeos (PT-BR) — confira a versão (React 18/19):**
- Busque por **"otimização de performance React pt-br"**, **"useMemo useCallback quando usar
  português"**, **"Core Web Vitals explicado pt-br"**, **"code splitting React lazy pt-br"**.
- Canais: *Rocketseat*, *Matheus Battisti – Hora de Codar*, *Dev Soutinho*.

> **Ressalva**: muito conteúdo de "otimização" ensina a memoizar tudo — o que pode **piorar** a
> performance e a legibilidade. Prefira material que diga "meça antes". O React 19 traz o
> *React Compiler* (memoização automática), que muda esse jogo; confira se o vídeo é pré ou
> pós-compiler. O projeto **não** usa o compiler.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é "re-renderizar" no React?**
<details><summary>Resposta-modelo</summary>
É o React executar de novo a função do componente para recalcular o que deve aparecer na tela,
em resposta a mudança de estado, props ou contexto. O React então compara o resultado com o
anterior e atualiza só o necessário no DOM.
</details>

**2. (Estudante) O que é o "bundle" de uma aplicação?**
<details><summary>Resposta-modelo</summary>
É o(s) arquivo(s) de JavaScript (e CSS) que o bundler (Vite) empacota a partir do seu código e
dependências para o navegador baixar. Quanto maior o bundle inicial, mais demora para a página
carregar e ficar interativa.
</details>

**3. (Júnior) Qual a diferença entre `useMemo` e `useCallback`?**
<details><summary>Resposta-modelo</summary>
`useMemo` memoiza um **valor** (o resultado de um cálculo); `useCallback` memoiza uma **função**
(`useCallback(fn, deps)` é equivalente a `useMemo(() => fn, deps)`). Use `useMemo` para evitar
recálculos caros e `useCallback` para estabilizar funções passadas como dependência de efeitos ou
props de filhos memoizados.
</details>

**4. (Júnior) O que é code-splitting e como o projeto o aplica?**
<details><summary>Resposta-modelo</summary>
É dividir o bundle em pedaços carregados sob demanda, em vez de tudo no início. O projeto usa
`import()` dinâmico para carregar o jsPDF só quando o usuário clica em "Exportar PDF"
([Auditoria.jsx](../../src/pages/Auditoria.jsx)), criando um chunk separado. Quem não exporta PDF
nunca baixa esse código.
</details>

**5. (Pleno) "Memoize tudo" é um bom conselho? Justifique.**
<details><summary>Resposta-modelo</summary>
Não. `useMemo`/`useCallback`/`memo` têm custo (memória, comparação de dependências) e poluem o
código. Para cálculos triviais ou componentes leves, o custo supera o ganho. A abordagem correta é
**medir** (Profiler/Lighthouse) e memoizar só gargalos reais — tipicamente cálculos caros, listas
grandes, ou referências passadas a filhos memoizados. O React 19 Compiler tende a automatizar
isso, reduzindo a necessidade de memoização manual.
</details>

**6. (Pleno) Como você diagnosticaria uma tela lenta neste projeto, passo a passo?**
<details><summary>Resposta-modelo</summary>
1) Reproduzir e medir com Lighthouse (LCP/INP/CLS) e a aba Performance. 2) Usar o React DevTools
Profiler para ver quais componentes re-renderizam e o custo. 3) Distinguir gargalo de **render**
(memoizar, dividir componente, virtualizar lista) de gargalo de **rede** (paginar, cachear,
paralelizar com `Promise.all`, lazy de libs). 4) Checar o relatório do `vite build` para bundle
grande → aplicar lazy por rota. 5) Otimizar o item de maior impacto e **medir de novo**. Evitar
otimizar por suposição.
</details>

**7. (Pleno) Quais decisões de API/rede deste projeto impactam performance e por quê?**
<details><summary>Resposta-modelo</summary>
Paginação em todas as listas (limita DOM e payload); API de caronas dividida em lista magra +
`/resumo` sob demanda (evita trazer detalhes de tudo, ao custo de uma 2ª chamada, mitigada por
cache); `Promise.all` para chamadas independentes em paralelo; `statsCache`/`detailCache` para
evitar refetch; e polling só com aba visível. Todas reduzem trabalho de rede/render. A evolução
seria React Query para padronizar cache/revalidação e lazy por rota para o bundle inicial.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Caça ao re-render"**: um app avulso para sentir memoização na prática.

1. Uma lista de ~1.000 itens fake renderizada com um componente filho `<Item>` que faz um
   cálculo artificialmente caro (ex.: um loop) — observe a lentidão ao digitar num input não
   relacionado da mesma tela.
2. Envolva `<Item>` em `React.memo` e estabilize as props (com `useCallback`/`useMemo`). Meça a
   diferença com o React DevTools Profiler (grave antes e depois).
3. Adicione um botão "Exportar" que faz `await import()` de uma lib (ex.: a própria `jspdf`) só no
   clique; confirme no Network que o chunk só baixa ao clicar.
4. **Bônus**: rode o Lighthouse na sua tela e anote LCP/INP/CLS.

**Critério de sucesso**: você consegue mostrar (com o Profiler) que `memo` + props estáveis
reduziram os renders; o chunk da lib só é baixado sob demanda; e você sabe ler os três Core Web
Vitals do seu Lighthouse.

---

## IA no fluxo de trabalho

- **Onde acelera**: identificar dependências faltando em hooks, sugerir onde `import()` dinâmico
  cabe, explicar leituras do Profiler/Lighthouse e gerar exemplos de memoização.
- **Onde atrapalha**: a IA tende a **memoizar tudo** (piorando legibilidade sem ganho medido),
  sugerir `memo` com props instáveis (inútil), e propor otimizações sem antes medir. Pode também
  ignorar o gargalo real (rede) e focar só em render.
- **Decisão sua**: **o que medir e o que vale otimizar** é julgamento de engenharia. Sempre exija
  de si (e da IA) um "número antes/depois". Otimização sem medição é suposição — e a sua avaliação
  do trade-off (custo de complexidade × ganho) é insubstituível.
