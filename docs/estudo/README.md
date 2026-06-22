# Trilha de Estudo — Painel TucTuc (React + Vite)

Bem-vindo(a). Esta pasta é um **curso autoguiado** sobre o código **deste** projeto: o
painel administrativo web da plataforma de carona solidária **TucTuc**, escrito em
**React 19 + Vite 8**. Cada módulo parte de um conceito e o ancora em **arquivos reais**
do repositório, com links clicáveis.

A trilha vai do **nível estudante** (sem pressupor experiência) ao **nível pleno**. O
backend (API + banco) é tratado como **caixa-preta**, exceto nos pontos onde o painel o
consome — aí a gente abre o contrato: endpoint, método, campos do JSON, eventos de
WebSocket.

> **Fonte da verdade**: o código do repositório + a documentação oficial das bibliotecas.
> Vídeos e artigos são apoio. Sempre confira a versão usada no vídeo contra a
> **tabela canônica de versões** abaixo.

---

## Como usar esta trilha

1. **Leia o módulo** com o projeto aberto ao lado. Clique nos links de arquivo (ex.:
   [main.jsx](../../src/main.jsx)) e leia o código real enquanto lê a explicação.
2. **Faça as "Âncoras de leitura"** — pequenas caças ao tesouro dentro do código. Elas
   forçam você a navegar o repositório, não só ler texto.
3. **Responda as 7 questões de entrevista** antes de abrir a resposta-modelo (que fica
   escondida em `<details>`). As duas primeiras são de fundamento; as outras sobem até
   pleno.
4. **Faça o desafio prático** quando tiver 1–2h livres. Cada desafio é **autocontido**:
   roda sozinho, com dados fake se preciso. Eles **não** se encaixam num app único — são
   exercícios avulsos.
5. Use o [GLOSSÁRIO](./GLOSSARIO.md) sempre que bater num termo desconhecido.

Pré-requisitos para rodar o projeto localmente: **Node.js 20.19+ ou 22.12+** (exigência do
Vite 8), o gerenciador `npm`, e um editor (VS Code recomendado). Comandos:

```bash
npm install      # instala dependências
npm run dev      # sobe o servidor de desenvolvimento (Vite) em http://localhost:5173
npm run build    # gera o build de produção em /dist
npm run preview  # serve o /dist localmente para conferência
npm run lint     # roda o ESLint
```

---

## Tabela canônica de versões

Extraída de [package.json](../../package.json) e [vite.config.js](../../vite.config.js).
**Esta é a referência.** Se um tutorial usa uma versão major diferente (ex.: React Router
v6, Vite 5), a API pode ser **incompatível** — confirme antes de copiar código.

| Pacote | Versão (package.json) | Papel no projeto |
| --- | --- | --- |
| `react` | `^19.2.4` | Biblioteca de UI (componentes, hooks) |
| `react-dom` | `^19.2.4` | Renderiza React no DOM do navegador |
| `react-router` | `^7.14.0` | Núcleo do roteamento |
| `react-router-dom` | `^7.14.1` | Liga o roteamento ao DOM/navegador |
| `@tabler/icons-react` | `^3.44.0` | Ícones SVG (componentes `Icon*`) |
| `recharts` | `^3.8.1` | Gráficos do Painel/Relatórios |
| `socket.io-client` | `^4.8.3` | WebSocket do chat de suporte |
| `jspdf` | `^4.2.1` | Geração de PDF (export da Auditoria) |
| `jspdf-autotable` | `^5.0.8` | Tabelas no PDF |
| `vite` | `^8.0.4` | Bundler/dev server |
| `@vitejs/plugin-react` | `^6.0.1` | Plugin React (Fast Refresh/JSX) no Vite |
| `eslint` | `^9.39.4` | Linter (flat config) |
| `@eslint/js` | `^9.39.4` | Regras base do ESLint |
| `eslint-plugin-react-hooks` | `^7.0.1` | Regras das Rules of Hooks |
| `eslint-plugin-react-refresh` | `^0.5.2` | Garante componentes compatíveis com HMR |
| `globals` | `^17.4.0` | Lista de variáveis globais para o ESLint |
| `@types/react` | `^19.2.14` | Tipos do React (autocompletar; sem TS no projeto) |
| `@types/react-dom` | `^19.2.3` | Tipos do React DOM |

Outros fatos do projeto:
- `"type": "module"` em [package.json](../../package.json#L5) → o projeto usa **ESM**
  (`import`/`export`), não `require`.
- **Sem TypeScript** ativo: o código é `.jsx`, mas os `@types/*` dão autocompletar no editor.
- **Sem Tailwind / styled-components**: o estilo é **CSS Modules** + **CSS variables**
  (ver Módulo 02).
- **Sem Redux/Zustand**: estado global só via **Context API** (Módulo 07).
- **Sem axios / React Query**: a camada de rede é um cliente `fetch` próprio (Módulo 05).
- **Sem testes** ainda: o Módulo 15 ensina a adicioná-los.

> ⚠️ **Atenção a tutoriais com versão errada**: React Router teve uma mudança grande
> entre v5 → v6 → v7. Vídeos antigos usam `<Switch>` (v5) ou padrões de v6 que diferem do
> que o projeto usa (`useRoutes` com array de objetos). Vite 8 também exige Node novo.
> Sempre cheque a versão no início do vídeo.

---

## Mapa dos módulos (do mais simples ao mais avançado)

| # | Módulo | Tema central |
| --- | --- | --- |
| 01 | [Anatomia do projeto](./01-anatomia-do-projeto.md) | Vite, `index.html`, `main.jsx`, `App.jsx`, StrictMode, HMR, árvore de Providers |
| 02 | [Design system e estilos](./02-design-system-e-estilos.md) | CSS Modules, tokens (CSS variables) em `global.css` |
| 03 | [Componentes e composição](./03-componentes-e-composicao.md) | Props, JSX, hooks, `children`, componentes controlados |
| 04 | [Roteamento](./04-roteamento.md) | React Router v7, rotas aninhadas, layouts, params/query, code-splitting |
| 05 | [Camada de API](./05-camada-de-api.md) | `fetch`, `http.js`, `ApiError`, geocoding, geolocalização |
| 06 | [Autenticação e sessão](./06-autenticacao-e-sessao.md) | JWT, `localStorage`, refresh, rotas protegidas |
| 07 | [Estado global](./07-estado-global.md) | Context API, `AuthContext`, alternativas |
| 08 | [Services e normalização](./08-services-e-normalizacao.md) | Shape canônico, nomes de campo crus do banco |
| 09 | [Formulários e fluxos](./09-formularios-e-fluxos.md) | Inputs controlados, validação, multi-etapas |
| 10 | [Tempo real (WebSocket)](./10-tempo-real-websocket.md) | Socket.io, `useSuporteSocket`, namespace `/suporte` |
| 11 | [Notificações](./11-notificacoes.md) | In-app (sino, toast) + como adicionar Web Push |
| 12 | [Feedback de UI](./12-feedback-de-ui.md) | Spinner, banner de erro, empty state, tradução de erro |
| 13 | [Performance](./13-performance.md) | Re-renders, `memo`/`useMemo`/`useCallback`, bundle, Core Web Vitals |
| 14 | [Build, ambiente e deploy](./14-build-ambiente-e-deploy.md) | `vite build`, `import.meta.env`, `.env`, fallback de SPA |
| 15 | [Testes](./15-testes.md) | Vitest + React Testing Library (como adicionar) |
| 16 | [Escala e tópicos avançados](./16-escala-e-topicos-avancados.md) | TypeScript, a11y, i18n, SSR/RSC, observabilidade |
| — | [Glossário](./GLOSSARIO.md) | Termos técnicos da trilha, com referências cruzadas |

---

## Plano de 20 dias

Pensado para ~1h de leitura + âncoras por dia, com os desafios encaixados quando der.
Tem dias de **revisão** e de **folga** (porque nem todo dia você vai abrir o editor). Se
um dia escapar, empurre tudo para frente — a ordem importa mais que o calendário.

| Dia | Foco | Entregável do dia |
| --- | --- | --- |
| 1 | Módulo 01 — Anatomia | Ler + âncoras. Rodar `npm run dev`. |
| 2 | Módulo 02 — Design system | Ler + âncoras. Achar 5 tokens em uso. |
| 3 | Módulo 03 — Componentes | Ler + âncoras. Desafio 03 (componente avulso). |
| 4 | Módulo 04 — Roteamento | Ler + âncoras. |
| 5 | **Revisão 01–04** | Refazer as questões 1–2 de cada módulo. Folga leve. |
| 6 | Módulo 05 — API | Ler + âncoras. Desafio 05. |
| 7 | Módulo 06 — Autenticação | Ler + âncoras. |
| 8 | Módulo 07 — Estado global | Ler + âncoras. |
| 9 | Módulo 08 — Services/normalização | Ler + âncoras. |
| 10 | **Revisão 05–08** | Entrevista simulada (questões 3–7). Folga. |
| 11 | Módulo 09 — Formulários | Ler + âncoras. Desafio 09. |
| 12 | Módulo 10 — Tempo real | Ler + âncoras. |
| 13 | Módulo 11 — Notificações | Ler + âncoras. |
| 14 | **Folga / pôr desafios em dia** | Terminar qualquer desafio pendente. |
| 15 | Módulo 12 — Feedback de UI | Ler + âncoras. Desafio 12. |
| 16 | Módulo 13 — Performance | Ler + âncoras. Rodar Lighthouse. |
| 17 | Módulo 14 — Build/deploy | Ler + âncoras. Rodar `npm run build`. |
| 18 | Módulo 15 — Testes | Ler + âncoras. Desafio 15 (escrever 1 teste). |
| 19 | Módulo 16 — Escala/avançado | Ler + âncoras. |
| 20 | **Revisão geral + Glossário** | Entrevista simulada completa. Revisar termos. |

---

## Documentação oficial (favorite estes links)

- **React** — https://react.dev (em PT: https://pt-br.react.dev)
- **React DOM / `createRoot`** — https://react.dev/reference/react-dom/client/createRoot
- **Hooks** — https://react.dev/reference/react/hooks
- **Vite** — https://vite.dev (em PT: https://pt.vite.dev)
- **React Router (v7)** — https://reactrouter.com
- **MDN Web Docs** (HTML, CSS, DOM, `fetch`, `localStorage`) — https://developer.mozilla.org/pt-BR/
- **CSS Modules** — https://github.com/css-modules/css-modules
- **Socket.IO (client)** — https://socket.io/docs/v4/client-api/
- **Recharts** — https://recharts.org
- **jsPDF** — https://github.com/parallax/jsPDF · **autoTable** — https://github.com/simonbengtsson/jsPDF-AutoTable
- **Tabler Icons** — https://tabler.io/icons
- **ESLint** — https://eslint.org/docs/latest/
- **Vitest** — https://vitest.dev · **React Testing Library** — https://testing-library.com/docs/react-testing-library/intro/
- **web.dev (Core Web Vitals/performance)** — https://web.dev/

---

## Ressalva sobre os vídeos do YouTube

Cada módulo sugere **vídeos reais** (verificados por busca) e também **canais + termos de
busca** em **português do Brasil**, porque conteúdo bom é publicado o tempo todo. Regras:

1. **A fonte da verdade é o código + a doc oficial.** Vídeo é para destravar intuição.
2. **Confira a versão** no início do vídeo contra a tabela canônica acima. React Router e
   Vite mudam de API entre versões major.
3. Se um link estiver fora do ar, use o **título + canal** indicados como termo de busca.

**Canais PT-BR confiáveis para web/React** (use como ponto de partida): *Rocketseat*,
*Matheus Battisti – Hora de Codar*, *Fernanda Kipper | Dev*, *Filipe Deschamps*,
*Hashtag Programação*, *Dev Soutinho*, *Willian Justen*, *Cod3r Cursos*, *Manual do Dev*.

> Os links específicos aparecem em cada módulo, no bloco **"Para aprofundar"**.
