# Módulo 14 — Build, ambiente e deploy

> **Objetivo**: entender o que acontece quando você roda `npm run build`, como o projeto lê
> **variáveis de ambiente** (`import.meta.env.VITE_*`), o papel dos arquivos `.env`, o
> *cache-busting* por hash, e o cuidado essencial de uma SPA no deploy: o **fallback de rotas**.

**Arquivos cobertos:**
- [package.json](../../package.json#L6-L11) — scripts (`dev`, `build`, `preview`, `lint`)
- [vite.config.js](../../vite.config.js) — configuração do Vite
- [src/services/http.js](../../src/services/http.js#L17-L19) — leitura de `VITE_API_URL`
- [index.html](../../index.html) — template que o build processa
- [.gitignore](../../.gitignore#L10-L13) — `dist`, `node_modules`, `*.local`

---

## 1. Dev × Build: dois modos do Vite

O Vite tem dois modos bem diferentes:

- **`npm run dev`** ([package.json](../../package.json#L7)): sobe um servidor de
  desenvolvimento (porta 5173, definida em [vite.config.js](../../vite.config.js#L8)). Ele serve
  os módulos **sob demanda** via ESM nativo do navegador, com HMR (Módulo 01). É rápido porque
  **não** empacota tudo a cada mudança.
- **`npm run build`** ([package.json](../../package.json#L8)): gera a versão de **produção** em
  `/dist`. Aqui o Vite (usando o Rollup/Rolldown por baixo) faz: empacotamento, *minificação*,
  *tree-shaking* (remove código não usado), divisão em *chunks* e hashing dos nomes.

Os dois comportam-se diferente — por isso "funcionou no dev" não garante "funciona no build".
Sempre teste o build antes de entregar (seção 6).

---

## 2. Variáveis de ambiente: `import.meta.env.VITE_*`

A app precisa saber **onde** está a API — e isso muda entre seu PC, homologação e produção. A
solução são variáveis de ambiente. O Vite expõe ao código **apenas** variáveis prefixadas com
`VITE_`, via o objeto `import.meta.env`. O projeto usa isso em
[http.js](../../src/services/http.js#L17-L19):

```js
const BASE_URL = (
  import.meta.env?.VITE_API_URL ?? "http://172.16.0.102:3000"
).replace(/\/+$/, "");
```

Lendo:
- `import.meta.env.VITE_API_URL` é o endereço da API, **injetado no build** a partir do `.env`.
- O `?? "http://172.16.0.102:3000"` é um **fallback** (default) para quando a variável não foi
  definida — útil em dev, mas em produção você **deve** definir a variável explicitamente.
- `.replace(/\/+$/, "")` remove barras finais, normalizando a URL.

> **Por que o prefixo `VITE_`?** É uma trava de **segurança**: tudo que vai para o bundle do
> front é **público** (qualquer um lê no navegador). O Vite só expõe variáveis `VITE_*` para
> você não vazar segredos do servidor por acidente. **Nunca** coloque senhas/chaves privadas em
> `VITE_*` — elas ficam visíveis no JavaScript entregue.

---

## 3. Arquivos `.env`

O Vite carrega variáveis de arquivos `.env` na raiz do projeto. A convenção:

| Arquivo | Quando é usado | Versionar no git? |
| --- | --- | --- |
| `.env` | Sempre | Pode (sem segredos) |
| `.env.local` | Sempre, **sobrescreve** | **Não** (ignorado) |
| `.env.development` | Só em `dev` | Pode |
| `.env.production` | Só em `build` | Pode |

Exemplo de um `.env` para este projeto:

```bash
VITE_API_URL=http://172.16.0.102:3000
```

O [.gitignore](../../.gitignore#L13) ignora `*.local`, então `.env.local` (onde vão valores da
sua máquina) não vai para o repositório. **Importante**: as variáveis são lidas em **tempo de
build** — mudar o `.env` exige reiniciar o `dev` ou refazer o `build`. Elas **não** são lidas em
tempo de execução no navegador.

---

## 4. O que o build gera em `/dist`

Após `npm run build`, o `/dist` contém algo como:

```
dist/
├── index.html
├── assets/
│   ├── index-a1b2c3d4.js      ← seu código + React, minificado
│   ├── index-e5f6g7h8.css     ← CSS dos Modules, concatenado
│   └── jspdf-x9y8z7.js        ← chunk separado (import dinâmico — Módulo 13)
├── favicon.svg
└── logo-texto.png
```

Pontos a entender:
- **Hashing / cache-busting**: o `a1b2c3d4` no nome muda quando o conteúdo muda. Isso permite o
  navegador **cachear agressivamente** (o arquivo nunca muda de conteúdo para um dado nome); ao
  publicar nova versão, o nome muda e o cache antigo é ignorado. Resolve o clássico "o usuário
  está vendo a versão velha".
- O [index.html](../../index.html) final tem o `<script src="/src/main.jsx">` **reescrito** para
  apontar para o `assets/index-[hash].js`.
- `dist` está no [.gitignore](../../.gitignore#L11) — artefato de build não se versiona; gera-se
  no servidor/CI.
- Arquivos em `public/` (como `favicon.svg`, `logo-texto.png`) são copiados **como estão** para a
  raiz do `dist`.

---

## 5. O cuidado nº 1 de SPA: fallback de rotas

Este é o erro de deploy mais comum com React Router. A SPA tem **uma** página real
(`index.html`); rotas como `/usuarios` existem **só** no JavaScript (Módulo 04). O problema:

- Navegar **dentro** do app para `/usuarios` → funciona (o Router intercepta).
- Digitar `https://site/usuarios` direto ou dar **F5** nessa URL → o navegador pede `/usuarios`
  **ao servidor**, que não tem esse arquivo → **404**.

A solução é configurar o servidor/host para, em qualquer rota desconhecida, **servir o
`index.html`** (o "history API fallback"). Aí o React carrega e o Router resolve a rota no
cliente. Como fazer depende do host:

- **Netlify**: arquivo `_redirects` com `/* /index.html 200`.
- **Vercel**: já trata SPA, ou `rewrites` no `vercel.json`.
- **Nginx**: `try_files $uri $uri/ /index.html;`.
- **Apache**: regra de `RewriteRule` para `index.html`.

> Sintoma típico de fallback faltando: "funciona quando navego clicando, mas dá 404 ao recarregar
> a página numa rota interna". Se você vir isso, é o fallback.

---

## 6. `preview`: testando o build localmente

Antes de publicar, rode o build de produção localmente com
[`npm run preview`](../../package.json#L10): ele serve o `/dist` (já minificado, com hashing)
num servidor local — **inclusive** com o fallback de SPA. É a forma de pegar problemas que só
aparecem em produção (ex.: um `import()` dinâmico que quebra minificado, ou uma `VITE_*` não
definida). Fluxo recomendado:

```bash
npm run build     # gera /dist
npm run preview   # serve /dist localmente para conferência
```

E o [`npm run lint`](../../package.json#L9) (ESLint flat config) deve passar **antes** do build —
idealmente no CI, para barrar erros antes do deploy.

---

## 7. Como isso conversa com a API e o banco

O elo direto é a **`VITE_API_URL`**: ela define a base de **todas** as chamadas do `http.js`
(Módulo 05). Consequências práticas:
- Em produção, aponte para a API de produção (HTTPS!). O default hardcoded
  (`http://172.16.0.102:3000`) é um IP de **rede local** — bom para desenvolvimento, **errado**
  para produção.
- Se a API estiver em **domínio diferente** do front, entra **CORS**: o servidor da API precisa
  permitir a origem do painel. CORS é configuração de **backend**, mas o sintoma (requisição
  bloqueada pelo navegador) aparece no front.
- HTTP × HTTPS: servir o front em HTTPS e a API em HTTP gera "mixed content" (bloqueado). Ambos
  devem ser HTTPS em produção — o que também é pré-requisito para Service Worker/Geolocation
  (Módulos 05 e 11).

---

## Âncoras de leitura

1. Em [http.js](../../src/services/http.js), ache a leitura de `VITE_API_URL` e o valor de
   fallback. Por que existe um fallback?
2. Em [vite.config.js](../../vite.config.js), descubra a porta do dev e qual plugin está ativo.
3. Em [package.json](../../package.json), liste os 4 scripts e diga o que cada um faz.
4. Em [.gitignore](../../.gitignore), confirme que `dist` e `*.local` são ignorados e explique por
   quê.
5. Em [index.html](../../index.html), identifique o que o build vai **reescrever** ao gerar o
   `/dist`.

---

## Para aprofundar

**Documentação oficial:**
- Vite — *Env Variables and Modes*: https://vite.dev/guide/env-and-mode
- Vite — *Building for Production*: https://vite.dev/guide/build
- Vite — *Deploying a Static Site*: https://vite.dev/guide/static-deploy
- Vite — *Preview*: https://vite.dev/guide/cli#vite-preview
- MDN — *CORS*: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS

**Vídeos (PT-BR) — confira a versão (Vite):**
- Busque por **"deploy React Vite Netlify pt-br"**, **"variáveis de ambiente Vite pt-br"**,
  **"deploy SPA fallback 404 React Router"**.
- Canais: *Rocketseat* (deploy), *Matheus Battisti – Hora de Codar*, *Willian Justen*.

> **Ressalva**: comandos de deploy mudam por host e por versão do Vite (a 8.x exige Node 20.19+/
> 22.12+). Confirme a versão do Node no vídeo e prefira a doc oficial de *static deploy* do Vite,
> que tem receitas por plataforma.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma "variável de ambiente"?**
<details><summary>Resposta-modelo</summary>
É um valor de configuração que vem de fora do código (do ambiente onde ele roda), permitindo que
o mesmo código se comporte diferente em dev, homologação e produção — por exemplo, o endereço da
API. No projeto, `VITE_API_URL` define a base das chamadas HTTP.
</details>

**2. (Estudante) Qual a diferença entre `npm run dev` e `npm run build`?**
<details><summary>Resposta-modelo</summary>
`dev` sobe um servidor de desenvolvimento com recarga rápida (HMR), servindo o código sem
empacotar tudo. `build` gera a versão otimizada de produção em `/dist` (minificada, com
tree-shaking e hashing). Dev é para programar; build é para publicar.
</details>

**3. (Júnior) Por que o Vite só expõe variáveis com prefixo `VITE_`?**
<details><summary>Resposta-modelo</summary>
Porque tudo que entra no bundle do front é público (visível no navegador). O prefixo é uma trava
de segurança para evitar vazar acidentalmente variáveis do sistema/servidor. Só `VITE_*` chega ao
`import.meta.env`. Por isso nunca se coloca segredo em `VITE_*`.
</details>

**4. (Júnior) Por que os arquivos de build têm um hash no nome (ex.: `index-a1b2c3.js`)?**
<details><summary>Resposta-modelo</summary>
Para *cache-busting*: o hash muda quando o conteúdo muda. Isso permite cache agressivo (o mesmo
nome sempre tem o mesmo conteúdo) e garante que, ao publicar nova versão, o navegador baixe o
arquivo novo (nome diferente) em vez de servir uma versão velha do cache.
</details>

**5. (Pleno) Por que uma SPA dá 404 ao recarregar uma rota interna e como resolver?**
<details><summary>Resposta-modelo</summary>
Porque as rotas (`/usuarios`) só existem no JavaScript do cliente; o servidor não tem um arquivo
nesse caminho. Ao recarregar/acessar direto, o navegador pede `/usuarios` ao servidor, que
responde 404. Solução: configurar o host para servir `index.html` em qualquer rota não
encontrada (history API fallback) — `_redirects` na Netlify, `try_files ... /index.html` no
Nginx, etc. Aí o React carrega e o Router resolve no cliente.
</details>

**6. (Pleno) O default `http://172.16.0.102:3000` está hardcoded. Quais riscos e como você
trataria em produção?**
<details><summary>Resposta-modelo</summary>
É um IP de rede local: em produção, se a `VITE_API_URL` não for definida, o app tentaria um
endereço inacessível/inseguro (HTTP). Riscos: app quebrado, mixed content (front HTTPS + API
HTTP), e CORS. Tratamento: definir `VITE_API_URL` explicitamente no ambiente de produção (HTTPS),
falhar o build/alertar se ela faltar, e idealmente remover o default de produção (ou deixá-lo só
para dev). Garantir CORS no backend para a origem do painel.
</details>

**7. (Pleno) Que etapas você colocaria num pipeline de CI/CD para este front?**
<details><summary>Resposta-modelo</summary>
1) Instalar deps (`npm ci`); 2) `npm run lint` (barrar erros de ESLint); 3) (quando houver)
rodar testes — Módulo 15; 4) `npm run build` com as `VITE_*` do ambiente-alvo injetadas como
secrets/variables do CI; 5) publicar o `/dist` no host com o fallback de SPA configurado; 6)
versionar/taguear. Pontos finos: variáveis por ambiente (homolog × prod), cache de `node_modules`
para acelerar, e um *smoke test* (ex.: `preview` + checagem da home) antes de promover.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Build, env e deploy de SPA"**: com um projeto Vite + React Router avulso (2-3 rotas).

1. Crie um `.env` com `VITE_API_BASE=https://exemplo.com` e leia-o via `import.meta.env` em algum
   componente, mostrando o valor na tela. Mude o valor e confirme que só muda após reiniciar o
   dev.
2. Rode `npm run build` e inspecione o `/dist`: ache os nomes com hash e veja o `index.html`
   reescrito.
3. Rode `npm run preview`, navegue até uma rota interna e dê **F5**. Confirme que funciona (o
   preview tem fallback).
4. **Bônus**: publique na Netlify/Vercel (plano free) e reproduza o 404 ao recarregar uma rota
   **sem** o fallback; depois adicione o `_redirects`/`vercel.json` e veja consertar.

**Critério de sucesso**: você lê uma `VITE_*` na tela; entende o `/dist` com hashing; recarregar
uma rota interna funciona no `preview`; (bônus) você provocou e corrigiu o 404 de SPA no host.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar `.env` de exemplo, escrever configs de fallback por host
  (`_redirects`, Nginx), montar um workflow de CI e explicar erros de build/CORS.
- **Onde atrapalha**: a IA às vezes sugere colocar segredos em `VITE_*` (erro grave de
  segurança), esquece o fallback de SPA (gerando o 404), e mistura instruções de versões/hosts
  diferentes. Pode também assumir Create React App (descontinuado) em vez de Vite.
- **Decisão sua**: **o que é segredo** (e portanto nunca vai para o front), **qual URL de API por
  ambiente**, e **a estratégia de deploy/CORS/HTTPS** são decisões de segurança e operação.
  Decida-as você; use a IA para gerar a configuração depois de definir as regras.
