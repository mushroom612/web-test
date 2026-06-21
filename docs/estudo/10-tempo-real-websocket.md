# Módulo 10 — Tempo real (WebSocket com Socket.IO)

> **Objetivo**: entender comunicação **em tempo real** no front: o que é um WebSocket, como o
> projeto usa **Socket.IO** (com um hook `useSuporteSocket`) para o chat de suporte, a
> diferença entre **enviar por HTTP** e **receber por socket**, salas (rooms) por conversa, e
> por que uma das telas usa **polling** em vez de socket.

**Arquivos cobertos:**
- [src/hooks/useSuporteSocket.js](../../src/hooks/useSuporteSocket.js) — conexão e ciclo de vida
- [src/pages/Suporte.jsx](../../src/pages/Suporte.jsx) — lado Dev: usa socket + HTTP
- [src/components/SupportChatPanel.jsx](../../src/components/SupportChatPanel.jsx) — lado Admin: usa polling
- [src/services/http.js](../../src/services/http.js#L207-L215) — exporta `BASE_URL`/`tokens` p/ o socket
- [src/services/api.js](../../src/services/api.js#L96-L134) — métodos REST do suporte

> **Contrato**: o socket conecta no namespace `/suporte` do servidor. Eventos: cliente emite
> `entrar_suporte`/`sair_suporte` (entrar/sair de uma sala por `admin_usu_id`); servidor emite
> `mensagem_suporte_recebida` com `{ spm_id, spm_texto, spm_remetente, spm_criada_em }`.

---

## 1. O problema: HTTP sozinho não "empurra" dados

Numa requisição HTTP normal, **o cliente pergunta e o servidor responde** — o servidor não
consegue, sozinho, avisar o cliente que "chegou mensagem nova". Para um chat, isso é limitante:
você só veria respostas se ficasse perguntando.

Três soluções clássicas:
- **Polling**: o cliente pergunta de tempos em tempos ("tem novidade?"). Simples, mas gera
  requisições mesmo sem novidade e tem atraso até o próximo ciclo.
- **WebSocket**: um canal **bidirecional** e **persistente** — o servidor empurra dados quando
  quiser, sem o cliente perguntar. Ideal para tempo real.
- **Server-Sent Events (SSE)**: empurrão só do servidor → cliente (unidirecional).

O projeto usa **WebSocket** (via Socket.IO) no lado Dev e **polling** no lado Admin — e isso é
intencional (seção 6).

---

## 2. Socket.IO: WebSocket com superpoderes

**Socket.IO** (`socket.io-client ^4.8.3`) é uma biblioteca sobre WebSocket que adiciona:
reconexão automática, **salas** (rooms), **namespaces**, e *fallback* de transporte. Você
trabalha com **eventos nomeados** (`socket.on('evento', handler)` / `socket.emit('evento',
dados)`) em vez de mensagens cruas.

> Não confunda `socket.io-client` (esta lib) com a **WebSocket API** nativa do navegador
> (`new WebSocket(url)`). Socket.IO tem protocolo próprio — cliente e servidor **precisam**
> usar Socket.IO compatível. Aqui o backend expõe um servidor Socket.IO no namespace
> `/suporte`.

---

## 3. O hook `useSuporteSocket`: conexão encapsulada

Toda a complexidade de conectar/desconectar vive em
[useSuporteSocket.js](../../src/hooks/useSuporteSocket.js):

```js
export function useSuporteSocket() {
  const [socket, setSocket]       = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const { access } = tokens.get();
    if (!access) return;                       // sem token → não conecta

    const s = io(`${BASE_URL}/suporte`, {
      auth:                { token: access },  // autentica o socket com o JWT
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
      transports:           ['websocket'],
    });

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);

    return () => { s.disconnect(); setSocket(null); setConnected(false); };  // limpeza
  }, []);

  return { socket, connected };
}
```

Pontos-chave:
- **Autenticação**: o token vai em `auth: { token: access }` — o servidor valida o JWT no
  *handshake*. Reúsa o mesmo `tokens`/`BASE_URL` do `http.js` (Módulo 05), uma fonte só.
- **Ciclo de vida**: conecta ao montar; o `return` do `useEffect` **desconecta** ao desmontar.
  Sem essa limpeza, trocar de página deixaria conexões zumbis (e o StrictMode em dev
  revelaria isso com a montagem dupla — Módulo 01).
- **Estado de conexão**: expõe `connected` para a UI saber se o tempo real está ativo.

Encapsular num hook deixa o componente focado na **lógica de chat**, não em encanamento de
socket — mesma filosofia do `api`/`http` (separação de camadas).

---

## 4. O padrão híbrido: enviar por HTTP, receber por socket

A página [Suporte.jsx](../../src/pages/Suporte.jsx) (lado Desenvolvedor) combina os dois
transportes — e o comentário do arquivo explica a decisão
([L11-L14](../../src/pages/Suporte.jsx#L11-L14)):

- **Envio → HTTP POST** ([handleSend](../../src/pages/Suporte.jsx#L178-L193)):
  `await api.responderSuporte(selectedId, texto)`. Por quê? HTTP é **confiável** e a mensagem
  é **persistida** no banco antes de qualquer broadcast. Você tem código de status, retry,
  tratamento de erro — garantias que importam para "não perder mensagem".
- **Recepção → evento de socket** ([L145-L169](../../src/pages/Suporte.jsx#L145-L169)):

  ```jsx
  useEffect(() => {
    if (!socket) return;
    const handleMsg = (msg) => {
      setMensagens(prev => [...prev, {
        msg_id: msg.spm_id, texto: msg.spm_texto,
        remetente: msg.spm_remetente, criado_em: msg.spm_criada_em,
      }]);
      // atualiza a prévia na lista de conversas...
    };
    socket.on('mensagem_suporte_recebida', handleMsg);
    return () => socket.off('mensagem_suporte_recebida', handleMsg);   // remove o listener
  }, [socket, selectedId]);
  ```

Note a **simetria de limpeza**: todo `socket.on` tem um `socket.off` no `return`. Sem isso,
cada re-render registraria um listener novo, duplicando mensagens (um bug clássico de socket
no React). E a normalização acontece aqui também: `spm_*` (nomes crus do banco) viram
`{ msg_id, texto, remetente, criado_em }` (Módulo 08).

> Resultado do híbrido: você envia com a robustez do HTTP e vê as mensagens (suas e do outro)
> chegarem instantaneamente pelo socket — sem recarregar. Ao enviar, a tela **nem** atualiza
> manualmente; espera o broadcast voltar ([comentário em L187](../../src/pages/Suporte.jsx#L187)).

---

## 5. Salas (rooms): isolar cada conversa

O Dev conversa com **vários** admins. Cada conversa é uma **sala**. Ao trocar de conversa, a
página sai da sala anterior e entra na nova
([L130-L136](../../src/pages/Suporte.jsx#L130-L136)):

```jsx
useEffect(() => {
  if (!socket) return;
  const prev = prevSelectedRef.current;
  if (prev && prev !== selectedId) socket.emit('sair_suporte', { admin_usu_id: prev });
  if (selectedId && connected)     socket.emit('entrar_suporte', { admin_usu_id: selectedId });
  prevSelectedRef.current = selectedId;
}, [selectedId, socket, connected]);
```

O `prevSelectedRef` (um `useRef`) lembra qual era a sala anterior para poder **sair** dela.
Salas garantem que o broadcast de uma conversa só chega a quem está naquela sala — escala
melhor que mandar tudo para todos e filtrar no cliente.

---

## 6. Por que o lado Admin usa polling (e não socket)

O [SupportChatPanel.jsx](../../src/components/SupportChatPanel.jsx) (painel flutuante do Admin)
**não** usa socket — usa **polling** a cada 6 segundos
([L26-L130](../../src/components/SupportChatPanel.jsx#L126-L130)):

```jsx
const POLL_MS = 6000;
useEffect(() => {
  const id = setInterval(() => load(true), POLL_MS);   // load(true) = silencioso
  return () => clearInterval(id);
}, [load]);
```

Por que a diferença? É um **trade-off pragmático**:
- O Admin tem **uma** thread só (com o Dev). O volume é baixo e a urgência menor.
- Polling de 6s é trivial de implementar e "bom o suficiente" para esse caso.
- O Dev, que atende **muitos** admins em paralelo, se beneficia mais do tempo real (socket).

É um bom exemplo de engenharia: **não** é preciso a mesma solução em todo lugar. O `load(true)`
silencioso evita "piscar" o estado de loading a cada ciclo (UX). O envio também é HTTP
(`api.enviarMensagemSuporte`), com o mesmo cuidado de devolver o texto ao campo se falhar
([L144-L153](../../src/components/SupportChatPanel.jsx#L144-L153)).

---

## 7. Efeito em performance e escala

- **Socket** evita o desperdício do polling (requisições mesmo sem novidade) e dá latência
  baixa — mas mantém uma **conexão aberta** por cliente (custo no servidor). Salas reduzem o
  *fan-out* de mensagens.
- **Polling** é simples, porém gera tráfego constante; com muitos usuários, N clientes × (1/6s)
  vira carga significativa. Por isso o projeto o reserva ao caso de baixo volume (Admin).
- **Vazamentos**: o maior risco de performance/bugs com socket no React é **não limpar**
  listeners/conexões. O projeto trata isso com `socket.off` e `disconnect()` nos `return` dos
  efeitos.
- **Reconexão**: `reconnectionAttempts: 5` + `reconnectionDelay: 2000` evitam tentativas
  infinitas que poderiam martelar um servidor caído.

---

## Âncoras de leitura

1. Em [useSuporteSocket.js](../../src/hooks/useSuporteSocket.js), ache onde o token é enviado
   ao servidor e o que acontece no `return` do `useEffect`.
2. Em [Suporte.jsx](../../src/pages/Suporte.jsx), localize o `socket.on(...)` e seu
   `socket.off(...)` correspondente. O que aconteceria sem o `off`?
3. Em [Suporte.jsx](../../src/pages/Suporte.jsx), explique por que o **envio** é HTTP e a
   **recepção** é socket.
4. Em [Suporte.jsx](../../src/pages/Suporte.jsx), siga a troca de salas: como a página sabe de
   qual sala **sair**?
5. Em [SupportChatPanel.jsx](../../src/components/SupportChatPanel.jsx), encontre o intervalo de
   polling e explique o papel do `load(true)` (silencioso).

---

## Para aprofundar

**Documentação oficial:**
- Socket.IO — *Client API*: https://socket.io/docs/v4/client-api/
- Socket.IO — *Rooms*: https://socket.io/docs/v4/rooms/
- Socket.IO — *Handshake/auth*: https://socket.io/docs/v4/middlewares/#sending-credentials
- MDN — *WebSocket API* (nativa): https://developer.mozilla.org/pt-BR/docs/Web/API/WebSocket
- MDN — *Server-Sent Events*: https://developer.mozilla.org/pt-BR/docs/Web/API/Server-sent_events

**Vídeos (PT-BR) — confira a versão (Socket.IO v4):**
- Busque por **"Socket.io React chat pt-br"**, **"WebSocket tempo real React português"**.
- Canais: *Rocketseat* (chat em tempo real), *Matheus Battisti – Hora de Codar*, *Cod3r*.

> **Ressalva**: a API do Socket.IO mudou entre v2/v3/v4. O projeto usa **v4** (`socket.io-client
> 4.x`). Em vídeos, confira a versão — exemplos antigos usam `io.connect` e opções diferentes.
> E lembre: cliente e servidor precisam ser Socket.IO (não serve contra um WebSocket cru).

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é um WebSocket e como difere de uma requisição HTTP comum?**
<details><summary>Resposta-modelo</summary>
WebSocket é um canal de comunicação **persistente e bidirecional** entre cliente e servidor:
uma vez aberto, ambos podem enviar dados a qualquer momento. HTTP comum é
requisição-resposta: o cliente pergunta, o servidor responde, e a conexão se encerra. WebSocket
é ideal para tempo real (chat, notificações ao vivo).
</details>

**2. (Estudante) O que é "polling"?**
<details><summary>Resposta-modelo</summary>
É o cliente perguntar ao servidor repetidamente, em intervalos fixos (ex.: a cada 6s), se há
novidade. Simples de implementar, mas gera requisições mesmo sem mudanças e tem atraso até o
próximo ciclo. No projeto, o painel do Admin usa polling de 6s.
</details>

**3. (Júnior) Por que todo `socket.on` precisa de um `socket.off` correspondente no React?**
<details><summary>Resposta-modelo</summary>
Porque o `useEffect` pode rodar várias vezes (re-render, StrictMode), e cada execução
registraria um novo listener. Sem remover o anterior com `socket.off` na função de limpeza, os
listeners se acumulam e o mesmo evento é tratado N vezes — mensagens duplicadas e vazamento de
memória. A limpeza no `return` mantém exatamente um listener ativo.
</details>

**4. (Júnior) Por que enviar mensagens por HTTP e recebê-las por socket, em vez de tudo por
socket?**
<details><summary>Resposta-modelo</summary>
Porque o HTTP dá **garantias** no envio: status de sucesso/erro, persistência no banco antes do
broadcast, retry e tratamento de falha. O socket é ótimo para **empurrar** a mensagem já
persistida em tempo real a quem está na sala. Assim combina-se confiabilidade (envio) com
baixa latência (recepção). É o padrão do [Suporte.jsx](../../src/pages/Suporte.jsx).
</details>

**5. (Pleno) Para que servem as "salas" (rooms) e como o projeto as gerencia ao trocar de
conversa?**
<details><summary>Resposta-modelo</summary>
Salas isolam o broadcast: uma mensagem de uma conversa só é entregue a quem está naquela sala,
evitando enviar tudo para todos e filtrar no cliente (não escala). Em
[Suporte.jsx](../../src/pages/Suporte.jsx), ao trocar de conversa, emite-se `sair_suporte` da
sala anterior (lembrada via `prevSelectedRef`) e `entrar_suporte` na nova. Isso mantém o cliente
inscrito só na conversa atual.
</details>

**6. (Pleno) Quando você escolheria polling, WebSocket ou SSE? Justifique com o projeto.**
<details><summary>Resposta-modelo</summary>
Polling: baixo volume/urgência e simplicidade (o painel do Admin, com uma thread). WebSocket:
bidirecional, alta interatividade e múltiplas conversas em paralelo (o Dev). SSE: quando só o
servidor precisa empurrar (notificações unidirecionais) e quer-se algo mais leve que WebSocket.
O projeto mistura conscientemente: socket onde o tempo real agrega (Dev) e polling onde "bom o
suficiente" basta (Admin) — evitando complexidade desnecessária.
</details>

**7. (Pleno) Quais cuidados de produção um chat por socket exige (auth, reconexão, escala)?**
<details><summary>Resposta-modelo</summary>
Autenticar o handshake (aqui, JWT em `auth: { token }`) e revalidar no servidor; reconexão com
limite/backoff (`reconnectionAttempts`/`reconnectionDelay`) para não martelar um servidor caído;
limpar listeners/conexões ao desmontar; usar salas para limitar fan-out; e, em escala horizontal
(vários servidores), um *adapter* (ex.: Redis) para propagar eventos entre instâncias.
Idempotência/dedupe de mensagens e ordenação por timestamp também ajudam. O front trata
auth, reconexão e limpeza; escala multi-instância é responsabilidade do backend.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Eco em tempo real"**: um chat mínimo de uma página. Como subir um servidor Socket.IO foge do
escopo de 1-2h, simule o "tempo real" no próprio cliente.

1. Crie um hook `useFakeSocket` que devolve `{ emit, on, off }` e, ao receber um `emit('msg',
   texto)`, dispara `on('msg')` após 300ms (simulando ida e volta do servidor) com um "eco".
2. Um componente de chat com lista de mensagens (estado) e um `<form>` de envio.
3. Registre o listener em um `useEffect` com **limpeza** (`off` no `return`) e prove, com um
   `console.count`, que o listener não duplica entre renders.
4. **Bônus**: adicione um separador de data ("Hoje"/"Ontem") como em
   [Suporte.jsx](../../src/pages/Suporte.jsx#L62-L78).

**Critério de sucesso**: enviar uma mensagem faz o "eco" aparecer ~300ms depois; o
`console.count` do listener nunca passa de 1 por montagem; remover a limpeza visivelmente
duplica os ecos (demonstre e depois conserte).

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar o boilerplate do hook de conexão, escrever handlers de eventos e
  lembrar a API do Socket.IO v4.
- **Onde atrapalha**: a IA frequentemente **esquece a limpeza** (`socket.off`/`disconnect`),
  causando listeners duplicados; mistura a WebSocket API nativa com Socket.IO; e propõe socket
  para tudo, ignorando que polling pode ser a escolha certa em baixo volume. Também pode sugerir
  versões antigas (`io.connect`).
- **Decisão sua**: **qual transporte usar onde** (socket × polling × SSE) e o **modelo de
  envio/recepção** (o híbrido HTTP+socket) são decisões de arquitetura com impacto em
  confiabilidade e escala. Decida-as pelo caso de uso; use a IA para implementar depois.
