# Módulo 16 — Escala e tópicos avançados

> **Objetivo**: olhar para o futuro do projeto. Quais limites a arquitetura atual tem e quais
> tópicos "de gente grande" entrariam conforme a base de código e de usuários cresce:
> **TypeScript**, **acessibilidade (a11y)**, **internacionalização (i18n)**, **SSR/RSC**,
> **observabilidade** e os limites práticos do desenho atual. É um módulo de **visão de
> arquitetura**, ancorado no que o projeto já tem (ou não tem).

**Arquivos/realidades de referência:**
- [package.json](../../package.json#L24-L26) — `@types/react` presente, mas **sem** TypeScript
- [src/services/http.js](../../src/services/http.js) — ponto natural de observabilidade
- [src/components/Aside.jsx](../../src/components/Aside.jsx), [Topbar.jsx](../../src/components/Topbar.jsx) — `aria-label` (base de a11y)
- Textos em PT-BR espalhados pela UI — ponto de partida para i18n

---

## 1. TypeScript: do `.jsx` ao `.tsx`

O projeto é JavaScript (`.jsx`), mas já tem os **tipos do React** instalados (`@types/react`,
`@types/react-dom` em [package.json](../../package.json#L24-L26)) — herança do template do Vite.
Hoje eles só dão autocompletar no editor; o código não é checado por tipos.

**Por que migrar para TypeScript** conforme cresce:
- **Contratos de API tipados**: os shapes documentados em comentários no
  [api.js](../../src/services/api.js) virariam `interface`/`type` verificados pelo compilador.
  `ride.car_status` deixaria de ser "qualquer coisa".
- **Props seguras**: erros como passar a prop errada a `<Pagination>` seriam pegos antes de rodar.
- **Refatoração confiável**: renomear um campo quebra o build (bom!), em vez de falhar silenciosamente em produção.

**Como seria a migração** (incremental, sem big bang):
1. Adicionar `typescript` e um `tsconfig.json`; o Vite já entende `.tsx` via o plugin.
2. Renomear arquivos `.jsx` → `.tsx` aos poucos, começando pelas camadas de **contrato**
   (`services/`, normalizadores) — onde tipos dão mais retorno.
3. Tipar o `ApiError`, os métodos do `api`, e o `value` do `AuthContext`.

Trade-off: curva inicial e verbosidade vs. menos bugs e melhor DX em escala. Para um TCC que
quer demonstrar maturidade, é o "próximo nível" mais valioso.

---

## 2. Acessibilidade (a11y)

Acessibilidade é construir para **todos**, incluindo quem usa leitor de tela, navega só por
teclado ou tem baixa visão. O projeto tem uma **base**: usa HTML semântico
(`<header>`, `<nav>`, `<main>`, `<aside>`), `aria-label` em botões de ícone
([Aside.jsx](../../src/components/Aside.jsx#L209), [Topbar.jsx](../../src/components/Topbar.jsx)),
`<label htmlFor>` nos formulários ([Login.jsx](../../src/pages/Login.jsx#L193)) e `role="dialog"`
no chat ([SupportChatPanel.jsx](../../src/components/SupportChatPanel.jsx#L165)).

**O que falta para subir de nível:**
- **Anunciar estados dinâmicos**: loading/erro com `aria-live`/`role="alert"` (Módulo 12) para o
  leitor de tela avisar o usuário.
- **Foco gerenciado**: ao abrir painéis/modais (PenaltyPanel, UserProfilePanel), prender o foco
  dentro e devolvê-lo ao fechar; suportar **ESC** para fechar.
- **Navegação por teclado**: garantir que dropdowns (sino, menu do usuário) e o layout
  mestre-detalhe de Caronas sejam operáveis sem mouse.
- **Contraste de cores**: validar que os tokens (Módulo 02) atendem WCAG AA (4.5:1 para texto).
- **`window.confirm`** (Módulo 12) é acessível por ser nativo, mas modais customizados precisam de
  cuidado explícito de a11y.

Como medir: a aba **Lighthouse** (categoria Accessibility), a extensão **axe DevTools**, e teste
manual com o leitor de tela do SO (NVDA/VoiceOver) e navegação só por Tab.

---

## 3. Internacionalização (i18n)

Hoje os textos estão **hardcoded em PT-BR** direto no JSX ("Entrar", "Nenhuma carona
encontrada."). Funciona para um público só, mas não escala para múltiplos idiomas.

Para internacionalizar, extrai-se o texto para **dicionários** por idioma e usa-se uma função de
tradução. Com **react-i18next** (o padrão do ecossistema):

```jsx
// em vez de: <button>Entrar</button>
const { t } = useTranslation();
<button>{t('login.entrar')}</button>
// pt.json → { "login": { "entrar": "Entrar" } }
// en.json → { "login": { "entrar": "Sign in" } }
```

Cuidados que i18n ensina:
- **Pluralização** (o projeto já faz na mão: `total !== 1 ? 's' : ''` no
  [Pagination.jsx](../../src/components/Pagination.jsx#L15)) — bibliotecas tratam regras
  complexas por idioma.
- **Datas/números**: o projeto já usa `toLocaleString('pt-BR')`
  ([Caronas.jsx](../../src/pages/Caronas.jsx#L72)) — a `Intl` API do navegador é a base de i18n
  de formatação e já está em uso.
- **Direção de texto** (RTL para árabe/hebraico), se for o caso.

Para o TucTuc (carona estudantil no Brasil), i18n provavelmente **não** é prioridade — mas saber
o caminho é importante. Não internacionalizar agora é uma decisão válida; espalhar texto cru
**sabendo** que dificultaria i18n futuro é a consciência que se espera.

---

## 4. SSR e React Server Components (RSC)

O projeto é **CSR** (Client-Side Rendering): o navegador baixa o JS e monta tudo (Módulo 01).
Alternativas para escala/SEO:

- **SSR (Server-Side Rendering)**: o servidor renderiza o HTML inicial; o cliente "hidrata"
  depois. Melhora o **LCP** e o **SEO** (conteúdo no HTML). Frameworks: Next.js, Remix, ou o
  próprio React Router 7 em "framework mode".
- **SSG (Static Site Generation)**: HTML gerado no build (para conteúdo estável).
- **RSC (React Server Components)**: componentes que rodam **no servidor** e não enviam seu JS ao
  cliente — reduz bundle. É a fronteira atual do React.

**Vale para este projeto?** Provavelmente **não**: é um painel **interno atrás de login**, onde
SEO é irrelevante e a complexidade de SSR não se paga (Módulo 01 já discutiu isso). SSR brilha em
sites públicos com conteúdo indexável. Reconhecer **quando não usar** uma tecnologia da moda é
sinal de maturidade.

---

## 5. Observabilidade

Em produção, você precisa **saber** quando algo quebra para o usuário — sem depender de ele
reclamar. O projeto hoje só faz `console.error` (ex.: na
[sanitizeErrorMessage](../../src/services/http.js#L70)). Próximos níveis:

- **Monitoramento de erros**: integrar **Sentry** (ou similar) para capturar exceções não
  tratadas e erros de `ApiError`, com stack trace e contexto (usuário, rota). O `http.js` é o
  ponto perfeito para reportar falhas de rede de forma centralizada.
- **Error Boundaries**: o React tem *error boundaries* (componentes que capturam erros de render
  de seus filhos e mostram um fallback). O projeto **não** tem um — adicionar um no topo evitaria
  a "tela branca" se um componente quebrar.
- **RUM (Real User Monitoring)**: medir Core Web Vitals reais (não só Lighthouse de laboratório),
  via `web-vitals` + um coletor.
- **Logs estruturados/analytics**: eventos de uso (quais telas, quais ações) para decisões de
  produto.

> Dica de implementação: um **Error Boundary** + Sentry no boot ([App.jsx](../../src/App.jsx)) e
> um *hook* de report no `catch` do [http.js](../../src/services/http.js) cobririam 80% do valor
> com pouco esforço.

---

## 6. Limites da arquitetura atual

Reconhecer onde o desenho atual **encosta no teto** é o ápice deste módulo:

| Limite atual | Quando vira problema | Evolução |
| --- | --- | --- |
| Estado de servidor com `useEffect`+`useState` por página | Muitas telas, cache/revalidação ad-hoc | **React Query/SWR** (Módulo 05) |
| Cache caseiro (`statsCache`, `detailCache`) | Invalidação manual fica frágil | Cache da lib de data-fetching |
| Sem TypeScript | Time cresce, contratos implícitos quebram | Migração incremental p/ TS |
| Todas as rotas no bundle inicial | Bundle grande, LCP ruim | Lazy por rota (Módulos 04/13) |
| Tokens em localStorage | Requisito de segurança mais rígido | Cookies HttpOnly (Módulo 06) |
| Sem testes | Refatorações arriscadas, regressões | Vitest + RTL (Módulo 15) |
| Notificações/menu mockados parcialmente | Recurso precisa ir a produção | Endpoints reais + socket |
| Sem Error Boundary/observabilidade | Erros silenciosos em produção | Sentry + boundary |

Nenhum desses é "erro" — são **trade-offs conscientes** para o tamanho atual do produto. A
habilidade pleno é saber **qual** atacar primeiro quando o contexto muda (mais usuários, mais
devs, requisito de SEO, etc.).

---

## Âncoras de leitura

1. Em [package.json](../../package.json), confirme que há `@types/react` mas **não** há
   `typescript`. O que isso significa na prática?
2. Em [Aside.jsx](../../src/components/Aside.jsx) e [Login.jsx](../../src/pages/Login.jsx), liste
   3 práticas de a11y já presentes (semântica/aria/label).
3. Em [Caronas.jsx](../../src/pages/Caronas.jsx) e [Pagination.jsx](../../src/components/Pagination.jsx),
   ache onde o projeto já faz formatação/pluralização "na mão" (base de i18n).
4. Em [http.js](../../src/services/http.js), identifique o melhor ponto para plugar
   monitoramento de erros (observabilidade).
5. Em [App.jsx](../../src/App.jsx), diga onde um **Error Boundary** entraria e o que ele evitaria.

---

## Para aprofundar

**Documentação oficial:**
- TypeScript + React: https://react.dev/learn/typescript
- TypeScript handbook: https://www.typescriptlang.org/docs/
- MDN — *Accessibility*: https://developer.mozilla.org/pt-BR/docs/Web/Accessibility
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- react-i18next: https://react.i18next.com/ · MDN *Intl*: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl
- React — *Server Components*: https://react.dev/reference/rsc/server-components
- Sentry (React): https://docs.sentry.io/platforms/javascript/guides/react/
- React — *Error Boundaries*: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"TypeScript com React pt-br"**, **"acessibilidade web a11y português"**,
  **"react-i18next português"**, **"Sentry React monitoramento de erros"**.
- Canais: *Rocketseat* (TS + React), *Dev Soutinho* (a11y), *Matheus Battisti – Hora de Codar*,
  *Willian Justen* (acessibilidade).

> **Ressalva**: estes temas evoluem rápido (RSC e React Compiler são fronteira em 2025-2026).
> Confirme que o vídeo fala de React 19 e do ecossistema atual; prefira a doc oficial para
> SSR/RSC, que muda com frequência.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é TypeScript e qual a relação com JavaScript?**
<details><summary>Resposta-modelo</summary>
TypeScript é um superconjunto do JavaScript que adiciona **tipos** estáticos verificados antes de
rodar. Todo JS válido é TS válido; o TS é compilado (transpilado) para JS para rodar no navegador.
Os tipos ajudam a pegar erros cedo e melhoram o autocompletar.
</details>

**2. (Estudante) O que é "acessibilidade" (a11y) numa aplicação web?**
<details><summary>Resposta-modelo</summary>
É projetar a aplicação para que pessoas com diferentes capacidades consigam usá-la — por exemplo,
quem usa leitor de tela, navega só por teclado ou precisa de alto contraste. Inclui HTML
semântico, textos alternativos, rótulos (`aria-label`/`label`) e navegação por teclado.
</details>

**3. (Júnior) Que benefícios concretos o TypeScript traria a este projeto?**
<details><summary>Resposta-modelo</summary>
Tipar os shapes da API (hoje só em comentários no `api.js`), pegar props erradas em componentes
antes de rodar, e tornar refatorações seguras (renomear um campo quebra o build em vez de falhar
em produção). Reduz bugs de normalização e melhora o autocompletar/DX, especialmente com mais
desenvolvedores no time.
</details>

**4. (Júnior) Por que SSR/Next.js provavelmente não compensa neste painel?**
<details><summary>Resposta-modelo</summary>
Porque é uma ferramenta interna atrás de login, sem necessidade de SEO nem de HTML renderizado no
servidor para indexação. SPA pura é mais simples de hospedar e manter. SSR agrega complexidade
(servidor, hidratação) que se paga em sites públicos indexáveis — não no caso. Saber quando **não**
adotar é tão importante quanto saber adotar.
</details>

**5. (Pleno) Como você priorizaria os "próximos passos" de arquitetura deste projeto?**
<details><summary>Resposta-modelo</summary>
Por risco × retorno × contexto. Provável ordem: (1) **testes** dos pontos críticos
(refresh/normalização) — destrava tudo com segurança; (2) **observabilidade** (Sentry + Error
Boundary) — visibilidade de produção; (3) **TypeScript incremental** começando pela camada de
contratos; (4) **React Query** para padronizar data-fetching/cache; (5) **lazy por rota** se o
bundle crescer. Segurança do token (cookie HttpOnly) sobe na lista conforme requisitos de
produção. A ordem muda com o contexto (mais usuários? mais devs? auditoria de segurança?).
</details>

**6. (Pleno) O que é um Error Boundary e por que este projeto se beneficiaria de um?**
<details><summary>Resposta-modelo</summary>
É um componente que captura erros de renderização dos seus filhos e exibe um fallback em vez de
derrubar a árvore inteira (tela branca). O projeto não tem nenhum: um erro de render numa página
hoje pode quebrar a app toda. Um boundary no topo ([App.jsx](../../src/App.jsx)) mostraria uma tela
de erro amigável e, integrado ao Sentry, reportaria o problema — melhorando resiliência e
observabilidade.
</details>

**7. (Pleno) Texto hardcoded em PT-BR: dívida técnica ou decisão válida? Como você trataria?**
<details><summary>Resposta-modelo</summary>
É uma decisão **válida** para um produto monolíngue (carona estudantil no Brasil) — i18n agora
seria over-engineering. Vira dívida **se/quando** surgir necessidade de outro idioma. Tratamento
pragmático: não internacionalizar já, mas evitar concatenar strings de forma que dificulte
extração futura, e centralizar formatação de data/número com `Intl` (o projeto já faz). Se o
requisito chegar, migra-se para react-i18next extraindo os textos para dicionários. Consciência do
trade-off é o ponto.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Endurecendo um componente"**: escolha **um** eixo avançado e aplique-o a um componente avulso.

Opção A — **TypeScript**: recrie o `Pagination` em `.tsx`, tipando todas as props (incluindo os
callbacks e o opcional `compact`). Force um erro de tipo (passe `page` como string) e veja o
compilador reclamar.

Opção B — **Acessibilidade**: pegue um dropdown (como o sino do Módulo 11) e torne-o acessível:
navegação por teclado (setas/Enter/Esc), `role`/`aria-expanded` corretos e foco gerenciado.
Valide com axe DevTools.

Opção C — **Observabilidade**: crie um `<ErrorBoundary>` que captura erro de um filho que lança de
propósito e mostra um fallback com botão "recarregar"; logue o erro no console com contexto.

**Critério de sucesso** (do eixo escolhido): A — o TS acusa o tipo errado e o componente compila
com props corretas; B — dá para operar o dropdown só pelo teclado e o axe não acusa violações
graves; C — o erro do filho não derruba a página e o fallback aparece.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar tipos a partir de shapes de API, sugerir correções de a11y, montar a
  config de i18n/Sentry e escrever um Error Boundary.
- **Onde atrapalha**: a IA pode "tipar com `any`" (anulando o benefício do TS), sugerir SSR/RSC
  sem necessidade real (hype), gerar ARIA incorreta (pior que nenhuma) e propor i18n/observabilidade
  como se fossem obrigatórios sempre.
- **Decisão sua**: a **priorização de arquitetura** — o que adotar, quando, e principalmente **o
  que NÃO adotar** — é a competência mais sênior e a menos delegável. A IA conhece as tecnologias;
  o **julgamento do trade-off no seu contexto** é seu. É exatamente isso que um TCC e uma entrevista
  pleno querem ver você defender.
