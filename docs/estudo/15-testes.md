# Módulo 15 — Testes (Vitest + React Testing Library)

> **Objetivo**: aprender a testar uma app React e **como adicionar** testes a este projeto, que
> hoje **não tem nenhum**. Você vai entender a pirâmide de testes, configurar **Vitest** + **React
> Testing Library** num projeto Vite, e escrever testes para as três camadas mais valiosas daqui:
> funções puras (normalização), o cliente HTTP, e componentes.

> ⚠️ **Estado atual**: o projeto **não** possui testes nem dependências de teste (confira o
> [package.json](../../package.json) — não há `vitest`, `@testing-library/*`). Este módulo é um
> guia de **como introduzi-los**. Por isso o desafio prático aqui é especialmente importante.

**Arquivos que seriam ótimos primeiros alvos de teste:**
- [src/pages/Caronas.jsx](../../src/pages/Caronas.jsx#L49-L137) — `statusLabel`, `formatDateTime`, `mergeResumo` (puras)
- [src/services/http.js](../../src/services/http.js) — montagem de URL, tratamento de erro, refresh
- [src/components/StatusBadge.jsx](../../src/components/StatusBadge.jsx), [Pagination.jsx](../../src/components/Pagination.jsx) (componentes)
- [src/context/AuthContext.jsx](../../src/context/AuthContext.jsx) — lógica de sessão

---

## 1. Por que testar (e a pirâmide)

Testes automatizados pegam regressões antes do usuário, documentam o comportamento esperado e
dão coragem para refatorar. A **pirâmide de testes** orienta a proporção:

```
        ╱╲     E2E (poucos)        — fluxo real no navegador (Playwright/Cypress)
       ╱──╲    Integração (alguns) — componentes + interações + API mockada
      ╱────╲   Unitários (muitos)  — funções puras, lógica isolada
```

- **Unitários**: rápidos e baratos; teste muito disso. As funções puras de normalização
  (Módulo 08) são alvos perfeitos.
- **Integração**: renderizar um componente e simular o usuário (clicar, digitar). É onde a RTL
  brilha.
- **E2E**: caros e lentos; reserve para os fluxos críticos (login, criar carona).

---

## 2. As ferramentas (compatíveis com este projeto)

- **Vitest**: test runner feito para Vite — reaproveita o `vite.config.js`, é rápido e tem API
  quase idêntica ao Jest (`describe`/`it`/`expect`). É a escolha natural aqui (vs. Jest, que
  exigiria configurar Babel/transform para Vite).
- **React Testing Library (RTL)**: testa componentes **como o usuário os vê** (por texto, papel,
  label), não por detalhes internos. Filosofia: "teste comportamento, não implementação".
- **@testing-library/jest-dom**: matchers extras (`toBeInTheDocument`, `toBeDisabled`).
- **@testing-library/user-event**: simula interações realistas (digitação, clique).
- **jsdom**: ambiente que simula o DOM no Node (a UI não roda num navegador real nos unit/integ).

---

## 3. Como configurar (passo a passo)

**1) Instalar** as dependências de desenvolvimento:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**2) Configurar o Vitest** no [vite.config.js](../../vite.config.js) (adicionar o bloco `test`):

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true,            // describe/it/expect sem importar
    environment: 'jsdom',     // simula o DOM
    setupFiles: './src/test/setup.js',
  },
})
```

**3) Arquivo de setup** (`src/test/setup.js`) para os matchers do jest-dom:

```js
import '@testing-library/jest-dom';
```

**4) Script** no [package.json](../../package.json):

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

`vitest` roda em modo *watch* (re-executa ao salvar); `vitest run` roda uma vez (para CI).

---

## 4. Teste unitário: funções puras de normalização

As funções de [Caronas.jsx](../../src/pages/Caronas.jsx) são o melhor ponto de partida —
**puras** (mesma entrada → mesma saída, sem efeitos), fáceis de testar. (Para testá-las, você
precisaria **exportá-las**; hoje são privadas ao módulo — uma pequena refatoração que o próprio
ato de testar incentiva.)

```js
// statusLabel.test.js
import { describe, it, expect } from 'vitest';
import { statusLabel } from '../pages/Caronas';   // exigiria export

describe('statusLabel', () => {
  it('traduz códigos numéricos', () => {
    expect(statusLabel(1)).toBe('Aberta');
    expect(statusLabel(3)).toBe('Finalizada');
    expect(statusLabel(0)).toBe('Cancelada');
  });
  it('repassa string já traduzida', () => {
    expect(statusLabel('Aberta')).toBe('Aberta');
  });
  it('usa fallback para código desconhecido', () => {
    expect(statusLabel(99)).toBe('Desconhecido');
  });
});
```

Esse teste documenta o contrato e protege contra mudanças acidentais no mapa de status. O mesmo
vale para `formatDateTime` (testar casos de borda: data nula, hora ausente) e `mergeResumo`
(testar a escolha de origem/destino por `pon_tipo`).

> Lição: **escrever testes melhora o design**. Funções puras exportáveis são testáveis; lógica
> enterrada dentro de um componente não é. Testar te empurra a separar lógica de UI.

---

## 5. Teste de componente: `Pagination`

A RTL renderiza o componente e verifica o que o usuário vê/faz. O
[Pagination](../../src/components/Pagination.jsx) é ótimo: tem lógica de `disabled` e callbacks.

```jsx
// Pagination.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../components/Pagination';

describe('Pagination', () => {
  it('desabilita "Anterior" na primeira página', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPrevious={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Anterior')).toBeDisabled();
    expect(screen.getByText('Próximo')).not.toBeDisabled();
  });

  it('chama onNext ao clicar em "Próximo"', async () => {
    const onNext = vi.fn();                       // função "espiã"
    render(<Pagination page={1} totalPages={5} total={50} onPrevious={() => {}} onNext={onNext} />);
    await userEvent.click(screen.getByText('Próximo'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

Repare: o teste busca por **texto** ("Próximo"), como um usuário faria — não pela classe CSS nem
pela estrutura interna. Se você refatorar o CSS, o teste continua passando (ele testa
comportamento). `vi.fn()` é um *mock* que registra chamadas.

---

## 6. Teste com mock de rede: o `http.js`

Para testar o cliente HTTP (Módulo 05) sem servidor real, mocka-se o `fetch`. Vitest oferece
`vi.fn()`/`vi.stubGlobal`. Exemplo testando a montagem de query e o tratamento de erro:

```js
// http.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, ApiError } from '../services/http';

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

it('monta query string ignorando vazios', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200 })
  );
  vi.stubGlobal('fetch', fetchMock);

  await http.get('/api/x', { query: { page: 1, q: '', status: undefined } });

  const calledUrl = fetchMock.mock.calls[0][0];
  expect(calledUrl).toContain('page=1');
  expect(calledUrl).not.toContain('q=');        // vazio é omitido
});

it('lança ApiError em status 4xx', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'Não encontrado' }), { status: 404 })
  ));
  await expect(http.get('/api/x', { auth: false })).rejects.toBeInstanceOf(ApiError);
});
```

Um teste mais avançado cobriria o **refresh em 401** (mockar o primeiro `fetch` com 401, o
`/refresh` com 200, e verificar que a requisição original é repetida) — exatamente a lógica mais
delicada do projeto, que mais se beneficia de teste.

> Para mocks de API mais realistas, a ferramenta moderna é o **MSW (Mock Service Worker)**, que
> intercepta requisições no nível da rede — vale conhecer quando os testes de integração
> crescerem.

---

## 7. O que priorizar neste projeto

Com tempo limitado, o retorno por teste é maior em:
1. **Funções puras de normalização** (`statusLabel`, `formatDateTime`, `mergeResumo`,
   `perTipoLabel`, `getActionVariant`) — baratas e protegem regras de negócio de exibição.
2. **`http.js`** — o refresh de token e a sanitização de erro são críticos e sutis (Módulos 05-06).
3. **`AuthContext`** — login que barra papel < 1, re-hidratação (Módulo 06).
4. **Componentes com lógica** — `Pagination` (disabled), `ErrorBanner` (dois modos),
   `StatusBadge` (fallback).

Telas inteiras (Caronas, Usuarios) são melhor cobertas por **integração** (com a API mockada) ou
**E2E** — depois que a base de unitários existir.

---

## 8. Como isso conversa com a API e o banco

Testes de front **não** tocam a API/banco reais — e isso é proposital: testes devem ser
**determinísticos** e rápidos. Você **mocka** a fronteira:
- Mockar `fetch` (ou usar MSW) para simular respostas e erros da API.
- Para testar componentes que chamam `api.*`, mocka-se o módulo `api` com
  `vi.mock('../services/api')`.
- Os **contratos** documentados nos comentários do [api.js](../../src/services/api.js) viram a
  base dos *fixtures* (dados fake) — testar com shapes realistas pega bugs de normalização.

E2E é a exceção: aí você sobe a app real contra uma API de teste (não produção!).

---

## Âncoras de leitura

1. Em [Caronas.jsx](../../src/pages/Caronas.jsx), liste 3 funções puras que seriam unitárias
   fáceis e diga um caso de borda de cada.
2. Em [Pagination.jsx](../../src/components/Pagination.jsx), identifique a regra de `disabled` que
   um teste deveria cobrir.
3. Em [http.js](../../src/services/http.js), aponte a lógica de refresh em 401 — por que ela é a
   mais importante de testar?
4. Em [package.json](../../package.json), confirme que **não** há dependências de teste hoje.
5. Em [ErrorBanner.jsx](../../src/components/ErrorBanner.jsx), descreva os dois cenários que dois
   testes distintos cobririam.

---

## Para aprofundar

**Documentação oficial:**
- Vitest: https://vitest.dev/guide/
- Vitest — *Testing React*: https://vitest.dev/guide/environment.html
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Testing Library — *Queries* (getByRole/Text): https://testing-library.com/docs/queries/about/
- jest-dom matchers: https://github.com/testing-library/jest-dom
- MSW (mock de API): https://mswjs.io/
- Playwright (E2E): https://playwright.dev/ · Cypress: https://www.cypress.io/

**Vídeos (PT-BR) — confira a versão (Vitest + RTL):**
- Busque por **"Vitest React Testing Library português"**, **"testes em React do zero pt-br"**,
  **"testando componentes React Testing Library pt-br"**.
- Canais: *Rocketseat* (testes em React), *Matheus Battisti – Hora de Codar*, *Dev Soutinho*.

> **Ressalva**: muito conteúdo PT-BR ensina **Jest** (não Vitest). A API é quase idêntica
> (`describe/it/expect`), mas a **configuração** difere — com Vite, prefira Vitest. Ignore tutoriais
> baseados em Create React App. A fonte da verdade é a doc do Vitest + RTL.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) Para que serve um teste automatizado?**
<details><summary>Resposta-modelo</summary>
Para verificar, de forma repetível, que o código se comporta como esperado — pegando regressões
quando algo é alterado, sem precisar testar tudo à mão. Também documenta o comportamento esperado
e dá segurança para refatorar.
</details>

**2. (Estudante) O que é um teste "unitário"?**
<details><summary>Resposta-modelo</summary>
É um teste que verifica uma unidade pequena e isolada de código (tipicamente uma função pura),
sem depender de rede, banco ou UI. É rápido e barato. Ex.: testar que `statusLabel(1)` retorna
`'Aberta'`.
</details>

**3. (Júnior) O que significa "testar comportamento, não implementação" na RTL?**
<details><summary>Resposta-modelo</summary>
Significa verificar o que o **usuário** percebe (textos, papéis, estados como disabled) em vez de
detalhes internos (nomes de estado, classes CSS, estrutura de componentes). Assim o teste
sobrevive a refatorações internas e só falha quando o comportamento real muda. Por isso a RTL
incentiva buscar por texto/role, não por classe.
</details>

**4. (Júnior) O que é um "mock" e por que mockar o `fetch` nos testes?**
<details><summary>Resposta-modelo</summary>
Mock é um substituto controlado de uma dependência. Mocka-se o `fetch` para que o teste não
dependa de uma API real (que seria lenta, instável e não determinística): você define a resposta
(sucesso, 404, 500) e verifica como o código reage. Garante testes rápidos e repetíveis.
</details>

**5. (Pleno) Por que Vitest em vez de Jest neste projeto?**
<details><summary>Resposta-modelo</summary>
Porque o projeto usa Vite: o Vitest reaproveita o `vite.config.js` e o pipeline de transformação
(ESM, JSX, aliases), sem configurar Babel/transformers como o Jest exigiria. É rápido, tem API
compatível com Jest (migração fácil) e integra HMR de testes. Jest funcionaria, mas com mais
fricção de configuração num projeto Vite/ESM.
</details>

**6. (Pleno) Quais partes deste projeto você testaria primeiro e por quê?**
<details><summary>Resposta-modelo</summary>
Funções puras de normalização (alto valor, baixo custo — protegem regras de exibição) e o
`http.js`, em especial o refresh de token em 401 e a sanitização de erro (lógica crítica e sutil,
onde um bug afeta toda a app). Depois o `AuthContext` (barrar papel < 1, re-hidratação) e
componentes com lógica (`Pagination`, `ErrorBanner`). Telas inteiras ficam para integração/E2E
após a base de unitários. Critério: risco × custo × frequência de mudança.
</details>

**7. (Pleno) Como você equilibraria a pirâmide de testes e integraria isso no CI?**
<details><summary>Resposta-modelo</summary>
Muitos unitários (rápidos), uma camada média de integração (componentes + API mockada com MSW), e
poucos E2E nos fluxos críticos (login, criar carona) com Playwright. No CI: `npm ci` → lint →
`vitest run` (unit/integração) com cobertura mínima como gate → build → E2E em ambiente de
homologação. E2E não roda contra produção. Manter os testes rápidos para feedback rápido; isolar
os lentos (E2E) num estágio próprio.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Primeiros testes do zero"**: num projeto Vite + React avulso (ou neste, se quiser de fato
adicionar testes).

1. Configure Vitest + RTL + jsdom (seção 3): instale, ajuste o `vite.config.js`, crie o setup e o
   script `test`.
2. Escreva uma função pura `statusLabel(code)` e **3+ testes** cobrindo os casos válidos, o
   fallback e o caso "já é string".
3. Crie um componente `Pagination` simples e teste: (a) "Anterior" desabilitado na página 1; (b)
   clicar "Próximo" chama o callback (use `vi.fn()` e `user-event`).
4. **Bônus**: escreva um teste que mocka `fetch` (`vi.stubGlobal`) e verifica que um cliente
   simples lança erro em status 404.

**Critério de sucesso**: `npm test` roda e os testes passam; ao quebrar `statusLabel` de
propósito, o teste correspondente **falha**; o teste do `Pagination` busca por texto (não por
classe CSS).

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar a configuração do Vitest, escrever a casca de testes (`describe/it`),
  criar *fixtures* a partir dos shapes do `api.js`, e sugerir casos de borda que você esqueceu.
- **Onde atrapalha**: a IA tende a escrever testes **acoplados à implementação** (buscando por
  classe CSS, espiando estado interno), a misturar APIs de Jest e Vitest, e a gerar testes que só
  repetem o código (sem valor). Também pode "testar" mocks em vez do comportamento real.
- **Decisão sua**: **o que vale testar** (priorização por risco) e **o nível certo** (unit ×
  integração × E2E) são julgamento de engenharia. Defina a estratégia e os casos críticos; use a
  IA para escrever os testes — e **sempre revise** se eles testam comportamento, não detalhe.
