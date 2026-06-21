# Glossário técnico

Termos que aparecem na trilha, explicados em linguagem simples + **como aparecem neste
projeto** + link para o módulo onde são aprofundados. Organizado alfabeticamente. Termos com
vários sentidos (ex.: "token") estão desambiguados.

> Voltar ao [índice da trilha](./README.md).

---

### a11y (acessibilidade)
Abreviação de *accessibility* (a + 11 letras + y). Práticas que tornam a app utilizável por
todos, inclusive quem usa leitor de tela ou só o teclado. **No projeto**: HTML semântico,
`aria-label` em botões de ícone, `<label htmlFor>` nos formulários. → [Módulo 16](./16-escala-e-topicos-avancados.md), [Módulo 12](./12-feedback-de-ui.md).

### AbortController
API do navegador para **cancelar** uma requisição `fetch` em andamento (via um `signal`).
**No projeto**: o `request()` do [http.js](../../src/services/http.js) aceita `signal`. → [Módulo 5](./05-camada-de-api.md).

### ApiError
Classe de erro **customizada** do projeto que carrega `status` (HTTP) e `body` (corpo da
resposta), além da mensagem. Permite a UI decidir pelo status. **No projeto**:
[http.js](../../src/services/http.js#L29). → [Módulo 5](./05-camada-de-api.md).

### ARIA (aria-label, aria-live, role)
Conjunto de atributos HTML que descrevem semântica/estado para tecnologias assistivas.
`aria-label` dá um nome a um elemento; `aria-live` anuncia mudanças; `role` define o papel.
**No projeto**: `aria-label` em botões; `role="dialog"` no chat. → [Módulo 16](./16-escala-e-topicos-avancados.md).

### atualização otimista (optimistic update)
Atualizar a UI **antes** da confirmação do servidor, assumindo sucesso (e revertendo se
falhar). Dá sensação de instantâneo. **No projeto**: candidato natural para "marcar
notificação como lida". → [Módulo 11](./11-notificacoes.md).

### bundle
O(s) arquivo(s) de JS/CSS que o bundler empacota para o navegador baixar. Bundle inicial grande
= carga mais lenta. **No projeto**: gerado pelo Vite em `/dist`; o jsPDF é separado em chunk via
`import()`. → [Módulo 13](./13-performance.md), [Módulo 14](./14-build-ambiente-e-deploy.md).

### cache-busting
Técnica de mudar o **nome do arquivo** (via hash) quando o conteúdo muda, para o navegador não
servir uma versão velha do cache. **No projeto**: o `vite build` gera nomes como
`index-a1b2c3.js`. → [Módulo 14](./14-build-ambiente-e-deploy.md).

### callback
Uma função passada como argumento para ser chamada depois, por quem a recebeu. **No projeto**:
`onPrevious`/`onNext` passados ao `Pagination`; `onRetry` ao `ErrorBanner`. → [Módulo 3](./03-componentes-e-composicao.md).

### canônico (shape canônico)
O formato "oficial" e estável de um dado dentro do app, para o qual os dados crus da API são
**normalizados**. **No projeto**: `listItemToRide` converte a carona crua no shape canônico de
UI. → [Módulo 8](./08-services-e-normalizacao.md).

### chunk
Um pedaço separado do bundle, carregado sob demanda. **No projeto**: o `import('jspdf')` gera um
chunk próprio. → [Módulo 13](./13-performance.md).

### code-splitting
Dividir o bundle em partes carregadas quando necessárias, em vez de tudo de uma vez. **No
projeto**: `import()` dinâmico do jsPDF; oportunidade de `React.lazy` por rota. → [Módulo 13](./13-performance.md), [Módulo 4](./04-roteamento.md).

### componente (controlado / não-controlado)
**Controlado**: input cujo valor vem do estado React (`value`+`onChange`). **Não-controlado**:
valor mora no DOM, lido via `ref`. **No projeto**: campos de Login/busca são controlados; o foco
do OTP usa `ref` (imperativo). → [Módulo 9](./09-formularios-e-fluxos.md), [Módulo 3](./03-componentes-e-composicao.md).

### Context API
Mecanismo do React para compartilhar estado com a árvore sem prop drilling: um `Provider`
publica, descendentes consomem com `useContext`. **No projeto**: `AuthContext`. → [Módulo 7](./07-estado-global.md).

### Core Web Vitals (LCP, INP, CLS)
Métricas do Google para experiência real: **LCP** (tempo até o maior conteúdo), **INP**
(resposta à interação), **CLS** (estabilidade visual). **No projeto**: afetados por bundle,
fontes e feedback de carregamento. → [Módulo 13](./13-performance.md).

### CORS
*Cross-Origin Resource Sharing* — regra do navegador que controla requisições entre origens
(domínios) diferentes; liberada pelo **servidor da API**. **No projeto**: relevante quando front
e API ficam em domínios distintos. → [Módulo 14](./14-build-ambiente-e-deploy.md).

### CSR (Client-Side Rendering)
A página é montada no **navegador** pelo JavaScript (oposto de SSR). **No projeto**: é o modelo
usado (SPA pura). → [Módulo 1](./01-anatomia-do-projeto.md), [Módulo 16](./16-escala-e-topicos-avancados.md).

### CSS Modules
CSS com **escopo local**: classes de um `arquivo.module.css` são renomeadas para nomes únicos,
evitando colisão. **No projeto**: todo estilo de componente. → [Módulo 2](./02-design-system-e-estilos.md).

### CSS variables (custom properties / tokens)
Valores nomeados (`--cor: #fff`) declarados em CSS e lidos com `var(--cor)`. Base do design
system. **No projeto**: dezenas de tokens em [global.css](../../src/global.css). → [Módulo 2](./02-design-system-e-estilos.md).

### debounce
Adiar a execução de uma ação até parar de ocorrer um gatilho por X ms (ex.: esperar o usuário
parar de digitar para buscar). **No projeto**: padrão recomendado para a busca de Usuários
(combinável com AbortController). → [Módulo 5](./05-camada-de-api.md).

### deep-linking
Permitir abrir um estado específico do app direto por URL. **No projeto**: `/usuarios?id=N` abre
o perfil daquele usuário. → [Módulo 4](./04-roteamento.md).

### design system
Conjunto de regras e peças reutilizáveis (tokens, componentes) para uma UI consistente. **No
projeto**: tokens semânticos + primitivos no `global.css` + componentes de UI. → [Módulo 2](./02-design-system-e-estilos.md).

### DOM (Document Object Model)
Representação em árvore da página HTML, em memória, manipulável por JavaScript. **No projeto**:
`document.getElementById('root')` no [main.jsx](../../src/main.jsx). → [Módulo 1](./01-anatomia-do-projeto.md).

### early return
Padrão de retornar cedo de uma função/render para tratar casos especiais (loading, erro) antes
do fluxo principal. **No projeto**: [Caronas.jsx](../../src/pages/Caronas.jsx) retorna spinner/
erro antes da lista. → [Módulo 12](./12-feedback-de-ui.md).

### Error Boundary
Componente React que captura erros de render dos filhos e mostra um fallback, evitando a tela
branca. **No projeto**: **não existe** — é uma melhoria sugerida. → [Módulo 16](./16-escala-e-topicos-avancados.md).

### ESM (ES Modules)
O sistema de módulos padrão do JavaScript (`import`/`export`). **No projeto**: `"type":
"module"` no [package.json](../../package.json); `<script type="module">` no index.html. → [Módulo 1](./01-anatomia-do-projeto.md).

### Fast Refresh
HMR específico do React: troca o componente preservando o estado. Exige que o arquivo exporte só
componentes. **No projeto**: o `eslint-disable` no [AuthContext](../../src/context/AuthContext.jsx#L117). → [Módulo 1](./01-anatomia-do-projeto.md).

### fetch
API nativa do navegador para requisições HTTP, baseada em Promises. **No projeto**: base do
[http.js](../../src/services/http.js) (sem axios). → [Módulo 5](./05-camada-de-api.md).

### FormData
Objeto para enviar dados de formulário/arquivos como `multipart/form-data`. **No projeto**:
uploads de contrato/OCR no [api.js](../../src/services/api.js#L214). → [Módulo 5](./05-camada-de-api.md).

### geocoding
Converter **endereço em texto** → coordenadas (lat/lon). O inverso é *reverse geocoding*. **No
projeto**: `api.geocodeAddress` via Nominatim (backend). → [Módulo 5](./05-camada-de-api.md).

### Geolocation API
API do navegador (`navigator.geolocation`) que obtém a posição **do dispositivo** (exige
permissão e HTTPS). **No projeto**: **não usada** (só geocoding via backend). → [Módulo 5](./05-camada-de-api.md).

### hidratação (re-hidratação)
(1) Em SSR: o cliente "liga" os eventos do HTML vindo do servidor. (2) **Neste projeto**:
re-hidratar a **sessão** = restaurar o usuário a partir do token salvo no boot. **No projeto**:
`AuthProvider` chama `/me` ao montar. → [Módulo 6](./06-autenticacao-e-sessao.md), [Módulo 16](./16-escala-e-topicos-avancados.md).

### HMR (Hot Module Replacement)
Atualizar módulos no navegador sem recarregar a página inteira, durante o dev. **No projeto**:
provido pelo Vite. → [Módulo 1](./01-anatomia-do-projeto.md).

### hook
Função do React (começa com `use`) que adiciona estado/efeitos/contexto a componentes de
função. **No projeto**: `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`,
`useContext`, `useNavigate`, `useSuporteSocket`. → [Módulo 3](./03-componentes-e-composicao.md).

### idempotente
Operação que, repetida, produz o mesmo resultado (sem efeito colateral acumulado). **No
projeto**: efeitos devem ser idempotentes para sobreviver à montagem dupla do StrictMode. → [Módulo 1](./01-anatomia-do-projeto.md).

### idiomático
Código escrito "do jeito esperado" pela linguagem/framework e pela convenção do projeto. **No
projeto**: a separação `main.jsx`/`App.jsx`/`routes.jsx` é idiomática em Vite + React. → [Módulo 1](./01-anatomia-do-projeto.md).

### i18n (internacionalização)
Preparar a app para múltiplos idiomas (textos em dicionários, formatação por locale). **No
projeto**: textos hardcoded em PT-BR; `Intl`/`toLocaleString` já em uso. → [Módulo 16](./16-escala-e-topicos-avancados.md).

### import dinâmico (`import()`)
Importar um módulo **sob demanda**, retornando uma Promise — base do code-splitting. **No
projeto**: `await import('jspdf')` na Auditoria. → [Módulo 13](./13-performance.md).

### import.meta.env
Objeto do Vite com as variáveis de ambiente (`VITE_*`) injetadas no build. **No projeto**:
`import.meta.env.VITE_API_URL` no [http.js](../../src/services/http.js). → [Módulo 14](./14-build-ambiente-e-deploy.md).

### jank
Travamentos/engasgos visuais (animações ou scroll não fluidos) causados por trabalho excessivo
na thread principal. **No projeto**: evitável com memoização e feedback local. → [Módulo 13](./13-performance.md).

### JSON
Formato de texto para dados estruturados; padrão de troca front↔API. **No projeto**:
`JSON.stringify`/`parse` no [http.js](../../src/services/http.js). → [Módulo 5](./05-camada-de-api.md), [Módulo 8](./08-services-e-normalizacao.md).

### JSX
Sintaxe que mistura "HTML" no JavaScript, transformada em chamadas que criam elementos React.
**No projeto**: todo componente. Atenção a `className`, `onClick`, `style={{}}`. → [Módulo 3](./03-componentes-e-composicao.md).

### JWT (JSON Web Token)
Token assinado pelo servidor que prova identidade/papel sem sessão no servidor. **No projeto**:
`access_token`/`refresh_token` no `localStorage`. → [Módulo 6](./06-autenticacao-e-sessao.md).

### lazy loading
Carregar algo só quando necessário (rota, componente, imagem). **No projeto**: `import()` do
jsPDF; `React.lazy` por rota é melhoria sugerida. → [Módulo 13](./13-performance.md), [Módulo 4](./04-roteamento.md).

### localStorage
Armazenamento chave-valor do navegador, persistente e síncrono, por origem. **No projeto**:
guarda os tokens (`auth_token`, `refresh_token`). → [Módulo 6](./06-autenticacao-e-sessao.md).

### memoização (memo/useMemo/useCallback)
Guardar o resultado de um cálculo/função para não refazê-lo se as entradas não mudarem. **No
projeto**: `useMemo` em `selectedRide`; `useCallback` em `load`/`loadUsers`. → [Módulo 13](./13-performance.md).

### namespace (Socket.IO)
Um "canal" lógico dentro de uma conexão Socket.IO. **No projeto**: `/suporte`. → [Módulo 10](./10-tempo-real-websocket.md).

### normalização (de dados)
Transformar dados crus (nomes de coluna do banco) no shape canônico de UI. (Não confundir com
*state normalization* do Redux.) **No projeto**: `listItemToRide`, `mergeResumo`. → [Módulo 8](./08-services-e-normalizacao.md).

### OTP (One-Time Password)
Código de uso único enviado por outro canal (e-mail), com validade curta. **No projeto**: 6
dígitos na recuperação de senha. → [Módulo 9](./09-formularios-e-fluxos.md), [Módulo 6](./06-autenticacao-e-sessao.md).

### Outlet
Componente do React Router que marca onde a rota **filha** é renderizada dentro de um layout.
**No projeto**: `AdminLayout`/`PublicLayout`. → [Módulo 4](./04-roteamento.md).

### params (route params × query params)
**Route param**: parte do caminho (`/usuarios/:id`). **Query param**: pares após `?`
(`/usuarios?id=5`). **No projeto**: usa query param (`?id=`) via `useSearchParams`. → [Módulo 4](./04-roteamento.md).

### polling
Perguntar ao servidor repetidamente em intervalos. **No projeto**: chat do Admin (6s), badge de
suporte (15s), lista de usuários (60s, só com aba visível). → [Módulo 10](./10-tempo-real-websocket.md), [Módulo 11](./11-notificacoes.md).

### prop
Dado de entrada passado de um componente-pai para um filho (somente leitura). **No projeto**:
toda a comunicação pai→filho. → [Módulo 3](./03-componentes-e-composicao.md).

### prop drilling
Passar uma prop por muitos níveis intermediários só para chegar a um componente profundo.
Resolvido com Context. **No projeto**: evitado para a sessão via `AuthContext`. → [Módulo 7](./07-estado-global.md).

### Promise / async-await
Promise representa um valor futuro (sucesso/falha); `async/await` escreve código assíncrono de
forma sequencial. **No projeto**: toda chamada de API. → [Módulo 5](./05-camada-de-api.md).

### Provider
Componente que fornece um valor de Context aos descendentes. **No projeto**: `AuthProvider`
envolve as rotas. → [Módulo 7](./07-estado-global.md), [Módulo 1](./01-anatomia-do-projeto.md).

### race condition
Bug quando o resultado depende da **ordem** imprevisível de operações concorrentes (ex.:
resposta antiga chega depois da nova). **No projeto**: tratado com flag `cancelled` nos efeitos
e `refreshInflight`. → [Módulo 8](./08-services-e-normalizacao.md), [Módulo 5](./05-camada-de-api.md).

### re-render
O React reexecutar a função do componente para recalcular a UI após mudança de estado/props/
contexto. **No projeto**: tema central de performance. → [Módulo 13](./13-performance.md).

### ref (useRef)
Referência mutável que persiste entre renders sem causar re-render; usada para acessar nós do
DOM ou guardar valores. **No projeto**: foco dos OTPs, clique-fora na Topbar, sala anterior no
Suporte. → [Módulo 9](./09-formularios-e-fluxos.md), [Módulo 10](./10-tempo-real-websocket.md).

### refresh token
Token de longa duração usado só para obter um novo access token. **No projeto**: refresh
automático em 401 no [http.js](../../src/services/http.js). → [Módulo 6](./06-autenticacao-e-sessao.md).

### room (sala — Socket.IO)
Agrupamento de sockets para broadcast direcionado. **No projeto**: uma sala por conversa de
suporte (`entrar_suporte`/`sair_suporte`). → [Módulo 10](./10-tempo-real-websocket.md).

### Rules of Hooks
Regras: chamar hooks só no topo do componente, nunca em condição/loop, e só em
componentes/hooks. **No projeto**: garantidas pelo `eslint-plugin-react-hooks`. → [Módulo 3](./03-componentes-e-composicao.md).

### sanitização (de erro)
Filtrar mensagens de erro para não vazar detalhes técnicos (SQL, schema) ao usuário. **No
projeto**: `sanitizeErrorMessage` no [http.js](../../src/services/http.js#L67). → [Módulo 12](./12-feedback-de-ui.md), [Módulo 5](./05-camada-de-api.md).

### Service Worker
Script que roda em segundo plano (fora da página), base de PWA/Web Push/cache offline. **No
projeto**: **não usado**. → [Módulo 11](./11-notificacoes.md).

### SPA (Single Page Application)
App que carrega uma página HTML e troca telas via JavaScript, sem recarregar. **No projeto**: é
o que o painel é. → [Módulo 1](./01-anatomia-do-projeto.md).

### SSR / SSG / RSC
**SSR**: HTML renderizado no servidor a cada request. **SSG**: HTML gerado no build. **RSC**:
componentes que rodam no servidor. **No projeto**: nenhum (é CSR). → [Módulo 16](./16-escala-e-topicos-avancados.md).

### StrictMode
Modo de desenvolvimento do React que monta/desmonta/monta componentes e roda efeitos 2× para
revelar bugs. Some em produção. **No projeto**: envolve o `<App />` no [main.jsx](../../src/main.jsx). → [Módulo 1](./01-anatomia-do-projeto.md).

### token (desambiguação)
**(1) Token de design**: valor nomeado de estilo (`--color-green-700`). → [Módulo 2](./02-design-system-e-estilos.md).
**(2) Token de autenticação**: JWT (`access`/`refresh`) que prova a sessão. → [Módulo 6](./06-autenticacao-e-sessao.md).
São coisas **diferentes** que compartilham o nome.

### tree-shaking
Remoção de código não utilizado durante o build. **No projeto**: feito pelo Vite no `build`. → [Módulo 14](./14-build-ambiente-e-deploy.md), [Módulo 13](./13-performance.md).

### TTL (Time To Live)
Tempo de validade de um dado em cache. **No projeto**: `STATS_TTL_MS` de 5 min no `statsCache`. → [Módulo 8](./08-services-e-normalizacao.md).

### TypeScript
Superconjunto tipado do JavaScript, compilado para JS. **No projeto**: **não** usado, mas
`@types/react` está presente; migração é melhoria sugerida. → [Módulo 16](./16-escala-e-topicos-avancados.md).

### Vite
Ferramenta de build/dev server usada pelo projeto (dev rápido via ESM, build via Rollup/
Rolldown). **No projeto**: versão 8.x. → [Módulo 1](./01-anatomia-do-projeto.md), [Módulo 14](./14-build-ambiente-e-deploy.md).

### virtualização
Renderizar só os itens visíveis de uma lista enorme (e reciclar ao rolar) para performance.
**No projeto**: não usado (listas são paginadas); útil se uma lista crescer muito. → [Módulo 13](./13-performance.md).

### WebSocket
Canal de comunicação bidirecional e persistente cliente↔servidor, para tempo real. **No
projeto**: via Socket.IO no chat do Dev. → [Módulo 10](./10-tempo-real-websocket.md).
