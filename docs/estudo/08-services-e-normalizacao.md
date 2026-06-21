# Módulo 08 — Services e normalização de dados

> **Objetivo**: entender por que a tela **nunca** deveria lidar com nomes crus de coluna do
> banco (`car_status`, `usu_nome`, `pon_tipo`), e como o projeto **normaliza** os dados da API
> para um formato "amigável" antes de renderizar. Você vai ver o *shape canônico*, os
> tradutores de código→rótulo, o cache em memória e o porquê dessa fronteira.

**Arquivos cobertos:**
- [src/pages/Caronas.jsx](../../src/pages/Caronas.jsx) — `listItemToRide`, `mergeResumo`, `statusLabel`
- [src/services/api.js](../../src/services/api.js) — tradução de nomes + `statsCache`
- [src/pages/Usuarios.jsx](../../src/pages/Usuarios.jsx#L88-L106) — `statusLabel`, `perTipoLabel`
- [src/pages/Auditoria.jsx](../../src/pages/Auditoria.jsx#L86-L95) — `TABELA_LABELS`
- [src/components/StatusBadge.jsx](../../src/components/StatusBadge.jsx) — consumidor de rótulos

---

## 1. O problema: o banco "vaza" na tela

A API deste projeto devolve os dados com os **nomes de coluna do banco**, que seguem
prefixos por tabela: `usu_` (usuários), `car_` (caronas), `esc_` (escolas), `pon_` (pontos),
`per_` (perfil), etc. Exemplos reais de resposta (documentados no
[api.js](../../src/services/api.js#L334-L342)):

```
caronas: [{ car_id, car_data, car_hor_saida, car_vagas_dispo, car_status,
            car_desc, motorista_id, motorista, motorista_email, vei_placa, vei_tipo }]
```

Se a tela usasse `ride.car_status === 1` e `ride.usu_nome` diretamente, dois problemas
surgiriam:
1. **Acoplamento ao schema**: renomear uma coluna no banco quebraria a UI inteira.
2. **Significado obscuro**: `car_status === 3` não diz nada; `'Finalizada'` diz.

A solução é uma camada de **normalização**: transformar o dado cru num **shape canônico**
(formato estável e legível) logo na fronteira, e a tela só conhece esse formato.

---

## 2. O shape canônico: `listItemToRide`

Em [Caronas.jsx](../../src/pages/Caronas.jsx#L82-L106), cada item cru da lista vira um objeto
de UI com nomes claros:

```jsx
function listItemToRide(r) {
  const nome = r.motorista || 'Motorista';
  return {
    id: r.car_id,
    driverName: nome,
    driverInitial: nome.charAt(0).toUpperCase(),
    driverId: r.motorista_id,
    status: statusLabel(r.car_status),     // número → rótulo
    statusCode: r.car_status,              // mantém o código p/ lógica
    date: formatDateTime(r.car_data, r.car_hor_saida),
    description: r.car_desc,
    origin: null, destination: null,       // virão do /resumo
    vagasDisponiveis: r.car_vagas_dispo,
    vehicle: r.vei_placa || null,
    passengers: []
  };
}
```

Note as decisões:
- **Nomes de domínio** (`driverName`, `vagasDisponiveis`) em vez de nomes de coluna.
- Campos ainda **não disponíveis** na lista (`origin`, `passengers`) viram `null`/`[]` —
  o shape é **completo e previsível** desde já; o resto chega depois (seção 4).
- Guarda **ambos**: o rótulo (`status: 'Aberta'`) para exibir e o código (`statusCode: 1`)
  para lógica. Separar "o que mostro" de "como comparo" evita comparar strings traduzidas.

---

## 3. Tradutores código → rótulo

A tradução de **código numérico → texto** é centralizada em funções puras. Em
[Caronas.jsx](../../src/pages/Caronas.jsx#L49-L58):

```jsx
function statusLabel(status) {
  if (typeof status === 'string') return status;   // alguns endpoints já mandam texto
  switch (Number(status)) {
    case 0: return 'Cancelada';
    case 1: return 'Aberta';
    case 2: return 'Em espera';
    case 3: return 'Finalizada';
    default: return 'Desconhecido';
  }
}
```

O mesmo padrão aparece em outras telas:
- [Usuarios.jsx](../../src/pages/Usuarios.jsx#L90-L100): `statusLabel(usu_status)` (1→'Ativo')
  e `perTipoLabel(per_tipo)` (1→'Admin', 2→'Dev', resto→'Usuário').
- [Auditoria.jsx](../../src/pages/Auditoria.jsx#L86-L95): o mapa `TABELA_LABELS`
  (`USUARIOS`→'Usuário', `CARONAS`→'Carona'…) traduz o nome de tabela para algo legível na
  coluna "Registro".

E há o **caminho inverso** (rótulo → código) para mandar filtros à API. Em
[Caronas.jsx](../../src/pages/Caronas.jsx#L142):

```jsx
const STATUS_TO_CODE = { 'Aberta': 1, 'Em espera': 2, 'Finalizada': 3, 'Cancelada': 0 };
```

Quando o usuário clica na aba "Aberta", a UI converte para `status: 1` antes de chamar
`api.getCaronas` ([Caronas.jsx](../../src/pages/Caronas.jsx#L172)). **A UI fala rótulos; a API
fala códigos; o tradutor faz a ponte nos dois sentidos.**

O `StatusBadge` (Módulo 03) fecha o ciclo: recebe o **rótulo** já traduzido (`'Aberta'`) e
mapeia para uma **cor**. Ele nunca vê `car_status`.

---

## 4. Composição de dados de duas chamadas: `mergeResumo`

A API de caronas é dividida: a **lista** (`/api/admin/caronas`) é minimalista; o **detalhe**
(`/api/caronas/:id/resumo`) traz origem, destino, passageiros e veículo completo. A tela
combina os dois com [`mergeResumo`](../../src/pages/Caronas.jsx#L114-L137):

```jsx
function mergeResumo(baseRide, resumo) {
  const { carona, pontos = [], passageiros = [] } = resumo || {};
  const origemPonto  = pontos.find(p => p.pon_tipo === 0);   // 0 = Partida
  const destinoPonto = pontos.find(p => p.pon_tipo === 1);   // 1 = Destino
  // ... monta endereço, veículo "Marca Modelo — Placa" ...
  return { ...baseRide, origin: originAddr, destination: destAddr, vehicle, passengers: passageiros };
}
```

Aqui a normalização vai além de renomear: ela **interpreta** o `pon_tipo` (0/1) para decidir
o que é origem e o que é destino, e **formata** o veículo juntando marca/modelo + placa. A
tela recebe `origin`/`destination` prontos — não precisa saber que origem é "o ponto com
`pon_tipo === 0`".

O resultado é unido ao objeto base com `useMemo` em
[selectedRide](../../src/pages/Caronas.jsx#L239-L245) (performance — Módulo 13): enquanto o
`/resumo` não chega, mostra-se o que veio da lista; quando chega, completa.

---

## 5. Tradução também na saída: nomes amigáveis → contrato

A normalização não é só na **entrada**. No `api.js`, os métodos traduzem argumentos
**amigáveis** para o **contrato** do backend. Ex.: [login](../../src/services/api.js#L32-L37):

```js
async login(email, senha) {
  const data = await http.post('/api/usuarios/login', { usu_email: email, usu_senha: senha }, { auth: false });
  // ...
}
```

A página passa `email`/`senha`; o serviço converte para `usu_email`/`usu_senha`. Outro caso:
[getMe](../../src/services/api.js#L49-L52) "achata" a resposta `{ user: ... }` para devolver
direto o usuário — o componente não precisa saber do envelope:

```js
async getMe() { const data = await http.get('/api/usuarios/me'); return data?.user ?? data; }
```

Esse padrão `data?.usuario ?? data` / `data?.user ?? data` aparece em vários lugares (ex.:
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L164)) — é uma **normalização defensiva** contra
o backend às vezes envelopar e às vezes não.

---

## 6. Cache em memória: `statsCache`

O `api.js` mantém um cache simples de estatísticas
([api.js](../../src/services/api.js#L16-L17), [L150-L173](../../src/services/api.js#L150-L173)):

```js
const statsCache = {};
const STATS_TTL_MS = 5 * 60 * 1000;   // 5 minutos
```

Quando o Dashboard e a tela de Relatórios pedem as mesmas estatísticas sem filtro, a segunda
chamada (dentro de 5 min) vem do cache, sem ir à rede. Com filtros, faz *bypass* (sempre
busca). É um cache de **dado de servidor** feito à mão — exatamente o tipo de coisa que o
React Query automatizaria (Módulos 05 e 13). Ainda assim, mostra a intenção: **nem todo dado
precisa ir à rede toda hora**.

> Há também o `detailCache` por `car_id` dentro de
> [Caronas.jsx](../../src/pages/Caronas.jsx#L159) (cache de detalhe local à página, some ao
> sair). Dois caches com escopos diferentes: um global no serviço, um local na tela.

---

## 7. Como isso conversa com a API e o banco

Esta é, literalmente, a **camada de tradução** entre banco e tela:
- **Entrada**: respostas com `prefixo_coluna` → objetos de domínio (`listItemToRide`,
  `mergeResumo`), com códigos traduzidos para rótulos (`statusLabel`, `perTipoLabel`,
  `TABELA_LABELS`).
- **Saída**: argumentos amigáveis → nomes de campo do contrato (`usu_email`, `status`).
- **Resiliência**: `?? data` para envelopes inconsistentes; `|| undefined` para filtros
  vazios; `String(...).slice(...)` para datas que vêm ora puras, ora ISO
  ([formatDateTime](../../src/pages/Caronas.jsx#L64-L76)).

A regra de ouro do módulo: **o prefixo de coluna do banco para na fronteira**. Componentes de
UI (Módulo 03) só veem nomes de domínio e rótulos.

---

## Âncoras de leitura

1. Em [Caronas.jsx](../../src/pages/Caronas.jsx), compare `listItemToRide` (entrada da lista)
   com `mergeResumo` (entrada do detalhe): que campos cada um preenche?
2. Em [Caronas.jsx](../../src/pages/Caronas.jsx), siga um clique na aba "Em espera": qual
   código é enviado à API e qual função faz a conversão?
3. Em [Usuarios.jsx](../../src/pages/Usuarios.jsx), ache `perTipoLabel` e diga o que retorna
   para `per_tipo` igual a 1, 2 e 0.
4. Em [api.js](../../src/services/api.js), encontre dois lugares onde a resposta é "achatada"
   com `?? data` e explique por quê.
5. Em [api.js](../../src/services/api.js), localize o `statsCache` e descreva quando ele é
   usado e quando é ignorado (bypass).

---

## Para aprofundar

**Documentação oficial / conceitos:**
- MDN — *Working with JSON*: https://developer.mozilla.org/pt-BR/docs/Learn/JavaScript/Objects/JSON
- MDN — *Array.prototype.map / find*:
  https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array/map
- MDN — *Optional chaining (`?.`)* e *Nullish coalescing (`??`)*:
  https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Optional_chaining
- React — *Choosing the State Structure* (formato dos dados em estado):
  https://react.dev/learn/choosing-the-state-structure
- Padrão DTO / Anti-Corruption Layer (leitura conceitual): https://martinfowler.com/bliki/

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"normalização de dados front-end pt-br"**, **"DTO front-end React"**,
  **"map filter reduce JavaScript pt-br"**.
- Canais: *Rocketseat*, *Matheus Battisti – Hora de Codar*, *Dev Soutinho* (boas práticas de
  arquitetura front).

> **Ressalva**: "normalização de dados" tem dois sentidos — o daqui (traduzir/forматar o shape
> na fronteira) e o de *state shape normalization* (Redux, evitar duplicação por id). Em
> vídeos, confirme de qual se fala. A base da verdade é o código deste projeto.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é um objeto em JavaScript e como acesso um campo dele?**
<details><summary>Resposta-modelo</summary>
É uma coleção de pares chave-valor, ex.: `{ car_id: 5, car_status: 1 }`. Acessa-se com ponto
(`ride.car_id`) ou colchetes (`ride['car_id']`). No projeto, as respostas da API são objetos
assim, com chaves prefixadas por tabela.
</details>

**2. (Estudante) O que faz `Array.prototype.map`?**
<details><summary>Resposta-modelo</summary>
Cria um **novo** array transformando cada elemento do original por uma função. No projeto,
`lista.map(listItemToRide)` transforma cada carona crua num objeto de UI. Não altera o array
original (imutabilidade).
</details>

**3. (Júnior) Por que traduzir `car_status` numérico para um rótulo em vez de usar o número na
tela?**
<details><summary>Resposta-modelo</summary>
Legibilidade e desacoplamento: a UI mostra "Finalizada" (claro) em vez de `3` (obscuro), e a
lógica de exibição não fica espalhada. Centralizar em `statusLabel` permite mudar rótulos num
lugar só e mantém o código numérico para comparações/filtros (`statusCode`). Evita também
comparar strings traduzidas, que quebram com i18n.
</details>

**4. (Júnior) Para que servem `?.` e `??` e onde o projeto os usa?**
<details><summary>Resposta-modelo</summary>
`?.` (optional chaining) acessa propriedades sem quebrar se algo for `null/undefined`
(`data?.user`). `??` (nullish coalescing) fornece um padrão só quando o valor é `null/undefined`
(`data?.user ?? data`), diferente de `||` que também cai em `0`/`''`. O projeto usa para
"achatar" respostas envelopadas e dar defaults defensivos.
</details>

**5. (Pleno) Por que manter uma camada de normalização entre API e UI? Cite um benefício
concreto deste projeto.**
<details><summary>Resposta-modelo</summary>
Para isolar a UI do schema do backend (uma *anti-corruption layer*). Benefício concreto: se o
backend renomear `car_desc` para `car_descricao`, só `listItemToRide`/`mergeResumo` mudam; toda
a renderização que usa `ride.description` continua intacta. Também concentra formatação (datas,
veículo) e tradução de códigos, evitando duplicação e bugs de inconsistência entre telas.
</details>

**6. (Pleno) O projeto combina dados de duas chamadas (lista + /resumo). Quais riscos isso traz
e como o código os trata?**
<details><summary>Resposta-modelo</summary>
Riscos: **race condition** (o usuário troca de carona antes da resposta chegar) e **estado
parcial** (mostrar campos vazios). O código trata com: flag `cancelled` no efeito para ignorar
respostas obsoletas ([Caronas.jsx](../../src/pages/Caronas.jsx#L218-L233)); `detailCache` por
id para não refazer; um shape base completo (`origin: null`) que permite renderizar a lista
enquanto o detalhe carrega, com spinners nos campos faltantes; e `useMemo` para recompor só
quando necessário.
</details>

**7. (Pleno) `statusLabel` aceita tanto número quanto string. Isso é bom ou um *code smell*?
Justifique.**
<details><summary>Resposta-modelo</summary>
É um **trade-off defensivo**: a função tolera endpoints inconsistentes (uns mandam código, outros
texto), evitando quebrar a UI. O custo é mascarar a inconsistência do contrato — idealmente o
backend padronizaria. Como mitigação realista, aceitar ambos no normalizador centralizado é
aceitável (a inconsistência fica contida em um ponto), mas eu documentaria e abriria tarefa para
alinhar o contrato. Em TypeScript, tiparia a entrada como união e trataria explicitamente.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Normalizador de API"**: com um JSON fake "cru" (estilo banco), escreva a camada que o
transforma para a UI.

1. Crie um array fake de "pedidos" com campos crus: `ped_id`, `ped_status` (0/1/2),
   `cli_nome`, `ped_total_centavos`, `ped_criado_em` (ISO).
2. Escreva `statusLabel(code)` (0→'Pendente', 1→'Pago', 2→'Cancelado', default→'Desconhecido')
   e `STATUS_TO_CODE` (o inverso).
3. Escreva `normalizePedido(p)` que devolve `{ id, clienteNome, status, statusCode,
   totalFormatado: 'R$ 12,34', data: 'dd/mm/aaaa' }` — formatando centavos e data.
4. Renderize (ou só `console.table`) a lista normalizada e um filtro por rótulo que converte
   para código antes de filtrar.

**Critério de sucesso**: nenhum componente/saída usa os nomes crus (`ped_`, `cli_`); trocar um
nome de campo cru exige editar **só** o normalizador; o filtro por "Pago" funciona convertendo
para código.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar funções de normalização a partir de um exemplo de JSON, escrever
  tabelas de tradução código↔rótulo e formatadores de data/moeda.
- **Onde atrapalha**: a IA às vezes faz a UI consumir os nomes crus direto (pulando a camada),
  confunde `||` com `??` (quebrando em `0`), e ignora estados parciais/race conditions ao
  combinar múltiplas chamadas. Pode também "inventar" campos que o backend não retorna.
- **Decisão sua**: definir o **shape canônico** (quais nomes de domínio a UI vai usar) e a
  **fronteira** (onde a tradução acontece) é decisão de arquitetura. Faça você o contrato
  interno; deixe a IA preencher os formatadores depois.
