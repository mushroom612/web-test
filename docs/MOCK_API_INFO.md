# Histórico — Camada de dados mockada (mock → API real)

> ⚠️ **Documento histórico.** A fase de dados mockados foi **concluída**. Hoje o
> painel consome a **API HTTP real** e os arquivos de mock foram **removidos** do
> projeto. Este documento fica como registro do que foi essa etapa do
> desenvolvimento (útil para o TCC).

## Status atual

| Item | Situação |
|---|---|
| Fonte de dados | API HTTP real via [src/services/api.js](../src/services/api.js) + [src/services/http.js](../src/services/http.js) |
| `src/data/mockData.js` | ❌ Removido |
| `src/data/supportMock.js` | ❌ Removido |
| Pasta `src/data/` | ❌ Removida (ficou vazia) |

## O que foi a fase de mocks

Enquanto a API backend ainda estava em desenvolvimento, o painel funcionava com
**dados fictícios em memória**, permitindo construir e testar as telas sem depender
do servidor. A ideia central era:

- Manter a **mesma interface pública** em `api.js` (mesmos nomes e assinaturas de
  métodos), de modo que a troca do mock pelo HTTP real **não exigisse mudar as telas**.
- Estruturar os dados fictícios seguindo o **schema do banco** (campos `usu_id`,
  `esc_id`, `car_id`, etc.), para que a transição fosse direta.
- Simular latência de rede com um `delay()`, aproximando o comportamento real.

Os dados mock cobriam usuários, escolas, caronas, sugestões/denúncias, estatísticas
do painel, logs de auditoria, penalidades e o chat de suporte.

## Como a migração foi feita

1. **`api.js` passou a fazer chamadas HTTP reais** (via `http.js`), substituindo as
   funções mock — mantendo os mesmos nomes de método, então as páginas não mudaram.
2. **Autenticação real**: token JWT (access + refresh) tratado no `http.js`
   (interceptor), em vez de login simulado.
3. **Parâmetros de data** passaram a usar `snake_case` na query (`data_inicio` /
   `data_fim`), conforme o backend.
4. **Remoção dos mocks**: com todas as telas consumindo a API, os arquivos
   `mockData.js` e `supportMock.js` deixaram de ter qualquer import e foram apagados.

## Lições da abordagem (para o TCC)

1. **Desacoplamento**: isolar o acesso a dados numa única camada (`api.js`) permitiu
   trocar a implementação (mock → HTTP) sem tocar nos componentes.
2. **Contrato estável**: definir cedo os nomes/assinaturas dos métodos e o formato
   dos dados (baseado no schema do banco) tornou a migração quase mecânica.
3. **Desenvolvimento paralelo**: frontend e backend puderam evoluir ao mesmo tempo.

---

_Migração concluída em junho de 2026._
