# Módulo 05 — Camada de API

> **Objetivo**: entender como o painel conversa com o servidor. Você vai ver o **cliente HTTP
> próprio** (`http.js`) construído sobre `fetch`, como ele injeta o token, trata erros com uma
> classe `ApiError`, esconde detalhes técnicos e tenta um *refresh* automático em 401. Também
> verá o **geocoding** de endereços e como (e se) adicionar a **geolocalização do navegador**.

**Arquivos cobertos:**
- [src/services/http.js](../../src/services/http.js) — cliente base (`fetch`, tokens, refresh, erros)
- [src/services/api.js](../../src/services/api.js) — métodos de alto nível (login, getUsers, …)
- [src/services/api.js](../../src/services/api.js#L244) — `geocodeAddress` (geocoding)
- Consumidores: [Usuarios.jsx](../../src/pages/Usuarios.jsx), [Auditoria.jsx](../../src/pages/Auditoria.jsx), etc.

> **Contrato com o backend**: a API roda em `VITE_API_URL` (default `http://172.16.0.102:3000`
> em [http.js](../../src/services/http.js#L17-L19)). Todos os caminhos começam com `/api/...`.
> Trate o servidor como caixa-preta — aqui só nos importam **endpoint, método, corpo e shape**.

---

## 1. Duas camadas: `http.js` (burra) e `api.js` (esperta)

A comunicação é dividida em duas camadas com responsabilidades distintas:

- **`http.js`** é "burra" de propósito: não conhece nenhum endpoint específico. Sabe apenas
  *como* falar HTTP — montar URL, anexar `Authorization`, serializar JSON, tratar 401/erros.
- **`api.js`** é a "esperta": conhece **cada** endpoint do produto (`/api/usuarios/login`,
  `/api/admin/caronas`, …) e expõe métodos amigáveis (`api.login`, `api.getCaronas`).

Os componentes **só** importam `api`, nunca `http` diretamente (com a exceção do
`useSuporteSocket`, que usa o `BASE_URL`/`tokens` exportados — Módulo 10). Essa separação é o
**Adapter Pattern**: se um dia trocar `fetch` por `axios`, muda-se só o `http.js`.

```
Componente  ──>  api.js (métodos por endpoint)  ──>  http.js (fetch + token + erros)  ──>  servidor
```

---

## 2. `fetch`: a API de rede do navegador

`fetch` é nativo do navegador — por isso o projeto **não** precisa de `axios`. Ele retorna
uma **Promise** que resolve para um objeto `Response`. O coração está em
[`request()`](../../src/services/http.js#L132):

```js
const res = await fetch(url, init);
// ...
if (res.status === 204) return null;        // 204 No Content → sem corpo
const text = await res.text();
let payload = text ? safeJsonParse(text) : null;
if (!res.ok) throw new ApiError(res.status, sanitizeErrorMessage(raw, res.status), payload);
return payload;
```

Pontos a notar:
- `res.ok` é `true` para status 2xx. `fetch` **não rejeita** em 4xx/5xx (diferente do axios);
  por isso o código checa `res.ok` manualmente e **lança** um erro.
- O corpo é lido como texto e só então tenta-se `JSON.parse`. Se falhar (ex.: a API devolveu
  **CSV** num relatório), retorna o texto cru — truque usado em
  [exportLogs](../../src/services/api.js#L489) e nos relatórios.
- `204 No Content` retorna `null` (ex.: DELETEs).

### Montagem de query string

[http.js](../../src/services/http.js#L137-L144) transforma `{ page, limit, status }` em
`?page=1&limit=20&...`, **pulando** valores `undefined`/`null`/`''`:

```js
const qs = new URLSearchParams();
for (const [k, v] of Object.entries(query)) {
  if (v !== undefined && v !== null && v !== "") qs.set(k, v);
}
```

Isso evita poluir a URL com filtros vazios. Por isso métodos como
[getCaronas](../../src/services/api.js#L339) podem passar `status: undefined` sem medo.

### Verbos como atalho

No fim do [http.js](../../src/services/http.js#L207-L213):

```js
export const http = {
  get:  (path, options)       => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put:  (path, body, options) => request("PUT", path, { ...options, body }),
  patch:(path, body, options) => request("PATCH", path, { ...options, body }),
  del:  (path, options)       => request("DELETE", path, options),
};
```

Deixa o `api.js` legível: `http.get('/api/admin/usuarios', { query })`.

---

## 3. `ApiError`: erro tipado que a UI entende

Em vez de lançar `Error` genérico, o projeto define uma **classe de erro** com status e corpo
([http.js](../../src/services/http.js#L29-L36)):

```js
export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;   // 401, 403, 404, 500...
    this.body = body;       // o JSON de erro do backend
  }
}
```

Assim a UI pode decidir o que fazer pelo **status**. Veja em
[Auditoria.jsx](../../src/pages/Auditoria.jsx#L160-L166): se a mensagem indica 403, mostra
"restrito a desenvolvedores"; senão, erro genérico. E em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L211) lê-se `err?.body?.error` para mostrar a
mensagem precisa do backend.

### Não vazar o schema do banco para o usuário

Um detalhe maduro: a função [`sanitizeErrorMessage`](../../src/services/http.js#L67-L78)
**filtra** mensagens técnicas antes de chegarem à tela. Erros 5xx viram "Erro interno do
servidor"; e há um regex ([SCHEMA_LEAK_RE](../../src/services/http.js#L60-L61)) que detecta
vazamento de nomes de coluna (`usu_`, `car_`…), códigos MySQL (`ER_...`, `SQLSTATE`) e
palavras SQL — substituindo por mensagem genérica. O detalhe real vai só para o `console`
(diagnóstico do dev). Isso é **segurança** (não revelar a estrutura interna) e **UX** (não
assustar o usuário com SQL).

---

## 4. Autenticação transparente e refresh automático

Toda chamada com `auth: true` (padrão) anexa o token
([http.js](../../src/services/http.js#L159-L162)):

```js
if (auth) {
  const { access } = tokens.get();
  if (access) init.headers.Authorization = `Bearer ${access}`;
}
```

Se o servidor responder **401** (token expirado), o cliente tenta **um único** refresh e
**repete** a requisição original ([http.js](../../src/services/http.js#L171-L178)):

```js
if (res.status === 401 && auth && !_retry) {
  try {
    await refreshTokens();
    return request(method, path, { ...options, _retry: true });  // _retry evita loop infinito
  } catch { /* cai no tratamento de erro com a resposta original */ }
}
```

Dois cuidados de engenharia:
- **`_retry`** garante **uma** tentativa só (sem loop).
- **`refreshInflight`** ([http.js](../../src/services/http.js#L82-L120)) garante que, se 5
  requisições tomarem 401 ao mesmo tempo, só **um** refresh acontece — as outras aguardam a
  mesma Promise. Sem isso, haveria uma tempestade de refreshes concorrentes.

Se o refresh falhar, o token é limpo e dispara-se um **evento global** `auth:logout` no
`window` ([http.js](../../src/services/http.js#L105-L109)). O `AuthContext` escuta e zera a UI
(Módulo 06). Usar um *evento* em vez de importar o contexto evita **dependência circular** —
o `http.js` não precisa conhecer o React.

Esse fluxo de auth é detalhado no [Módulo 06](./06-autenticacao-e-sessao.md).

---

## 5. `api.js`: o catálogo de endpoints

Cada método encapsula um endpoint e, às vezes, **regra de negócio leve**. Exemplos:

- **`login`** ([api.js](../../src/services/api.js#L32-L43)) faz `POST /api/usuarios/login`
  com `{ usu_email, usu_senha }`, salva os tokens e devolve os dados. Repare que o front usa
  nomes amigáveis (`email`, `senha`) mas o **contrato do backend** usa `usu_email`,
  `usu_senha` — a tradução acontece aqui (Módulo 08).
- **`getCaronas`** ([api.js](../../src/services/api.js#L339)) documenta o shape de resposta no
  comentário: `{ total, page, caronas: [{ car_id, car_data, ... }] }`.
- **`enviarNotificacao`** ([api.js](../../src/services/api.js#L451)) **escolhe o endpoint** pelo
  argumento: com `usu_id` → notifica um usuário; sem → broadcast à escola. Regra de negócio na
  camada de serviço.
- **uploads** (`uploadContractFile`, `uploadOcrTemplate`) usam **`FormData`**
  ([api.js](../../src/services/api.js#L214-L227)); o `http.js` detecta `FormData` e **não**
  força `Content-Type: application/json` ([http.js](../../src/services/http.js#L146-L155)),
  deixando o navegador definir o boundary do multipart.

> O `statsCache` (cache em memória de 5 min para estatísticas) também mora no `api.js`
> ([api.js](../../src/services/api.js#L16-L17)). Ele é tema do Módulo 08 (normalização) e
> Módulo 13 (performance).

---

## 6. Geocoding (e a geolocalização do navegador)

### O que existe: geocoding via backend

O projeto converte **texto de endereço → coordenadas** com
[`geocodeAddress`](../../src/services/api.js#L244):

```js
async geocodeAddress(q, limite = 5) {
  return http.get('/api/pontos/geocode', { query: { q, limite } });
}
```

O backend usa o **Nominatim (OpenStreetMap)** por trás (mín. 3 caracteres, rate limit ~20
req/min). A resposta é um array de `{ display_name, lat, lon, ... }`. Isso é **geocoding**
(endereço → lat/lon), usado para autocompletar endereços (ex.: ao cadastrar instituição).
Fazer via backend é uma boa decisão: centraliza o rate limit e esconde a fonte de dados.

### O que NÃO existe (e como adicionar): geolocalização do navegador

> Decisão da trilha: **meio-termo** — em vez de um módulo próprio, segue um guia de "como
> adicionar".

O navegador oferece a **Geolocation API** (`navigator.geolocation`) para pegar a posição
**do dispositivo do usuário** (GPS/Wi-Fi). Hoje o painel **não** a usa (faz sentido: é uma
ferramenta administrativa de desktop). Se um dia precisar — por exemplo, "centralizar o mapa
na minha posição" — o padrão seria:

```js
// Exemplo de como você adicionaria (não está no projeto)
function getPosicaoAtual() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocalização não suportada'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),                       // usuário negou ou falhou
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

Pontos de atenção (que valem como aprendizado):
- **Permissão**: o navegador pede consentimento; trate a negação com mensagem clara.
- **HTTPS obrigatório**: a Geolocation API só funciona em contexto seguro (https ou
  localhost).
- **Reverse geocoding**: para transformar a lat/lon de volta em endereço, você combinaria com
  um endpoint inverso no backend (semelhante ao `geocode`).

---

## 7. Alternativas de arquitetura de rede

| Abordagem | Prós | Contras | No projeto |
| --- | --- | --- | --- |
| **`fetch` + cliente próprio** (escolhido) | Zero dependências, controle total, leve | Você escreve refresh/erros/cache na mão | É o que existe (`http.js`) |
| **axios** | Interceptors prontos, sintaxe enxuta, rejeita em 4xx | +dependência, redundante com `fetch` moderno | Não usado |
| **React Query / SWR** | Cache, dedupe, revalidação, estados de loading/erro automáticos | Curva de aprendizado, +bundle | Não usado (estado de fetch é manual nas páginas) |
| **tRPC / GraphQL client** | Tipagem ponta a ponta / queries declarativas | Exige backend compatível | Fora de escopo |

A escolha por cliente `fetch` próprio é coerente com um projeto enxuto e sem TypeScript: você
aprende a plataforma e não carrega peso. O **maior** ganho de uma migração seria adotar
**React Query** para eliminar o `useEffect`+`useState` repetidos de cada página e ter cache de
verdade (hoje só o `statsCache` cobre estatísticas).

---

## 8. Efeito em performance

- **`fetch` nativo** = zero custo de bundle (vs. ~13kb do axios).
- **`refreshInflight`** evita N refreshes concorrentes — economiza rede e evita corrida.
- **Sem cache de requisições** (fora `statsCache`): navegar e voltar refaz os fetches. Em
  listas muito acessadas, React Query reduziria chamadas. Hoje é mitigado por **polling leve**
  (60s) só com a aba visível ([Usuarios.jsx](../../src/pages/Usuarios.jsx#L149-L154)).
- **`AbortController`**: o `request` aceita `signal` ([http.js](../../src/services/http.js#L132)),
  permitindo **cancelar** requisições — útil em buscas com debounce para não processar
  respostas obsoletas (race conditions).

---

## Âncoras de leitura

1. Em [http.js](../../src/services/http.js), encontre **onde** o `Authorization: Bearer` é
   anexado e em que condição ele é omitido.
2. Em [http.js](../../src/services/http.js), explique o papel de `_retry` e de `refreshInflight`
   — o que cada um previne?
3. Em [http.js](../../src/services/http.js), leia o `SCHEMA_LEAK_RE` e diga **um** exemplo de
   mensagem que ele bloquearia.
4. Em [api.js](../../src/services/api.js), ache um método que **escolhe** o endpoint conforme
   o argumento e explique a regra.
5. Em [api.js](../../src/services/api.js), localize `geocodeAddress` e descreva o shape do
   array retornado.

---

## Para aprofundar

**Documentação oficial:**
- MDN — *Fetch API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API
- MDN — *Response*: https://developer.mozilla.org/pt-BR/docs/Web/API/Response
- MDN — *URLSearchParams*: https://developer.mozilla.org/pt-BR/docs/Web/API/URLSearchParams
- MDN — *Geolocation API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation_API
- MDN — *AbortController*: https://developer.mozilla.org/pt-BR/docs/Web/API/AbortController
- Nominatim (geocoding): https://nominatim.org/release-docs/latest/
- TanStack Query (alternativa): https://tanstack.com/query/latest

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"Fetch API JavaScript pt-br"** (MDN-style) e **"consumindo API no React pt-br"**.
- Canais: *Matheus Battisti – Hora de Codar* (fetch/async no React), *Rocketseat* (consumo de
  API), *Fernanda Kipper | Dev*. Para a alternativa moderna: **"React Query / TanStack Query
  português"**.

> **Ressalva**: `fetch`, Promises e `async/await` são estáveis há anos — vídeos um pouco
> antigos servem. Só confirme que usam `async/await` (não callbacks antigos) e `fetch` nativo
> (não `XMLHttpRequest`).

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é JSON?**
<details><summary>Resposta-modelo</summary>
JSON (*JavaScript Object Notation*) é um formato de texto para representar dados estruturados
(objetos, arrays, strings, números, booleanos). É o formato padrão de troca entre front e API.
No projeto, `JSON.stringify` serializa o corpo enviado e `JSON.parse` lê a resposta.
</details>

**2. (Estudante) O que é uma Promise e o que `async/await` faz?**
<details><summary>Resposta-modelo</summary>
Uma Promise representa um valor que ficará disponível no futuro (sucesso ou falha) — típico de
operações assíncronas como rede. `async/await` é açúcar sintático para escrever código baseado
em Promises de forma sequencial e legível: `await fetch(...)` "espera" a resposta sem travar a
UI. Erros viram exceções capturáveis com `try/catch`.
</details>

**3. (Júnior) Por que o projeto checa `res.ok` manualmente em vez de confiar no `fetch`
rejeitar?**
<details><summary>Resposta-modelo</summary>
Porque o `fetch` só rejeita a Promise em falha de **rede**; respostas com status 4xx/5xx são
consideradas "bem-sucedidas" do ponto de vista do `fetch` (a resposta chegou). Então é preciso
checar `res.ok` (2xx) e, se for falso, lançar o erro manualmente — é o que o
[http.js](../../src/services/http.js#L192-L200) faz com `ApiError`.
</details>

**4. (Júnior) Para que serve uma classe de erro customizada como `ApiError`?**
<details><summary>Resposta-modelo</summary>
Para carregar metadados além da mensagem — aqui, `status` e `body`. Isso permite que a UI
**decida** pelo status (ex.: 403 → "restrito a devs", 401 → relogar) e leia mensagens
específicas do backend (`err.body.error`), em vez de tratar todo erro como string genérica.
</details>

**5. (Pleno) Explique a estratégia de refresh de token e os problemas que `_retry` e
`refreshInflight` resolvem.**
<details><summary>Resposta-modelo</summary>
Em 401, o cliente faz um refresh e repete a requisição original. `_retry` marca que aquela
chamada já tentou uma vez, evitando **loop infinito** se o refresh "dar certo" mas a chamada
seguir 401. `refreshInflight` guarda a Promise do refresh em andamento para que **múltiplas**
requisições que tomam 401 simultaneamente compartilhem **um único** refresh, evitando corrida e
invalidação cruzada de tokens. Se o refresh falha, limpa tokens e emite `auth:logout`.
</details>

**6. (Pleno) Por que sanitizar mensagens de erro e o que se perde/ganha com isso?**
<details><summary>Resposta-modelo</summary>
Ganha-se **segurança** (não vazar nomes de tabela/coluna, códigos SQL — que ajudariam um
atacante a mapear o banco) e **UX** (mensagens claras em vez de stack traces). Perde-se detalhe
para o usuário final — por isso o detalhe real vai ao `console.error` para o desenvolvedor
diagnosticar. O equilíbrio: genérico na tela, completo no log. Ver
[sanitizeErrorMessage](../../src/services/http.js#L67).
</details>

**7. (Pleno) Quando você migraria para React Query e o que mudaria na arquitetura atual?**
<details><summary>Resposta-modelo</summary>
Quando a repetição de `useState(loading/erro/dados)` + `useEffect(fetch)` em cada página virar
custo de manutenção e faltar cache/revalidação real (refetch ao focar a aba, dedupe de chamadas
iguais, paginação com cache). Eu manteria o `http.js` como `fetcher` e moveria a orquestração
para `useQuery`/`useMutation`, removendo estados manuais e o polling caseiro. Trade-off: +bundle
e nova curva, mas menos bugs de estado e melhor performance percebida. O `statsCache` seria
substituído pelo cache do React Query.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Mini cliente HTTP resiliente"**: num arquivo JS avulso (Node ou navegador), recrie uma
versão enxuta do `http.js` contra uma API pública fake (ex.: `https://jsonplaceholder.typicode.com`).

1. Função `request(method, path, { body, query, auth })` usando `fetch`, que: monta query
   string pulando vazios; serializa JSON; checa `res.ok`; lança um `ApiError {status, body}`.
2. Atalhos `get/post/put/del`.
3. Simule um token em variável e anexe `Authorization` quando `auth !== false`.
4. **Bônus**: simule um 401 (chame um endpoint inválido) e implemente um `_retry` único com um
   "refresh" fake que só loga "refreshing..." e tenta de novo.

**Critério de sucesso**: chamadas de sucesso retornam o JSON; uma rota inexistente lança
`ApiError` com `status` correto; a query string ignora parâmetros `undefined`/`''`; o retry só
acontece uma vez.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar boilerplate de cliente HTTP, montar `URLSearchParams`, escrever o
  catálogo de métodos a partir de uma lista de endpoints, e explicar diferenças `fetch` × axios.
- **Onde atrapalha**: a IA costuma esquecer que `fetch` não rejeita em 4xx, propõe axios sem
  necessidade, e implementa refresh **sem** proteção contra concorrência (`refreshInflight`) ou
  contra loop (`_retry`) — exatamente os pontos finos deste projeto. Também pode "vazar" erros
  técnicos direto na UI.
- **Decisão sua**: o **contrato com o backend** (nomes de campo, endpoints, o que é cache vs.
  tempo real) e a **política de erros/segurança** (o que esconder do usuário) são decisões de
  produto/segurança. Defina-as você; use a IA para o encanamento.
