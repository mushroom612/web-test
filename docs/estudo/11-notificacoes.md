# Módulo 11 — Notificações

> **Objetivo**: entender o sistema de notificações **in-app** do painel — o sino com contador
> na Topbar, os badges de "não lidas" do suporte — e o envio de notificações para usuários/escola
> via API. Depois, ver **como adicionar Web Push** (notificações do navegador via Service Worker),
> que hoje o projeto **não** usa.

**Arquivos cobertos:**
- [src/components/Topbar.jsx](../../src/components/Topbar.jsx) — sino + dropdown + badge de suporte
- [src/data/mockData.js](../../src/data/mockData.js) — `notificationData` (mock do sino)
- [src/services/api.js](../../src/services/api.js#L442-L463) — `enviarNotificacao`
- [src/services/api.js](../../src/services/api.js#L126-L134) — `getNaoLidasSuporte` (badge)
- [src/pages/Notificacoes.jsx](../../src/pages/Notificacoes.jsx) — tela de emissão (hoje desativada na rota)

> Decisão da trilha: **meio-termo** — Web Push entra como seção "como adicionar", não módulo
> próprio.

---

## 1. Os três tipos de notificação no projeto

É importante separar conceitos que a palavra "notificação" mistura:

1. **Notificação in-app (sino)**: o ícone de sino na Topbar com um contador e um dropdown de
   itens recentes. Vive **dentro** da aplicação; só aparece com o painel aberto.
2. **Badge de não lidas**: contadores numéricos que sinalizam pendências (ex.: mensagens de
   suporte não lidas). Também in-app.
3. **Emissão de notificação**: o painel **envia** uma notificação para um usuário ou para toda
   a escola (que o app mobile/usuário final recebe). Aqui o painel é o **emissor**, via API.

O que o projeto **não** tem: **Web Push** (notificações do sistema operacional/navegador que
chegam mesmo com a aba fechada). Isso é a seção 6.

---

## 2. O sino de notificações (in-app)

Na [Topbar.jsx](../../src/components/Topbar.jsx), o sino é um botão com um **badge** condicional
e um **dropdown** que abre ao clicar:

```jsx
<button className={styles.bellBtn} onClick={() => toggleMenu("notifications")}>
  <IconBell size={20} />
  {notifCount > 0 && <span className={styles.badge}>{notifCount}</span>}
</button>
```

Quando aberto, lista os itens e oferece "Marcar todas como lidas" (que zera o contador local
com `setNotifCount(0)`). Os dados vêm de `notificationData` em
[mockData.js](../../src/data/mockData.js) — ainda **mockados**. O comentário no arquivo registra
que isso será migrado para um endpoint real numa rodada futura. Cada item tem `message` e
`timestamp`, e um "ponto" visual indica não lido vs. lido
([Topbar.jsx](../../src/components/Topbar.jsx)).

Padrões React em ação aqui (revisão dos Módulos 02-03):
- **Renderização condicional** do badge (`notifCount > 0 && ...`).
- **`.map()`** dos itens com `key`.
- **Clique fora fecha o menu**: um `useRef` (`rightRef`) + listener de `mousedown` no
  `document` ([Topbar.jsx](../../src/components/Topbar.jsx)) — padrão clássico de dropdown.

---

## 3. Badge de "não lidas" do suporte (com polling)

O outro indicador in-app é o contador de mensagens de suporte não lidas, no botão de suporte da
Topbar. Ele é buscado por **polling leve** a cada 15s
([Topbar.jsx](../../src/components/Topbar.jsx)):

```jsx
useEffect(() => {
  if (!user?.usu_id) return;
  const role = isDev ? "dev" : "admin";
  let cancelled = false;
  const fetchNaoLidas = async () => {
    try {
      const data = await api.getNaoLidasSuporte({ role, usuId: user.usu_id });
      if (!cancelled) setSuporteNaoLidas(data?.nao_lidas || 0);
    } catch { /* silencioso */ }
  };
  fetchNaoLidas();
  const id = setInterval(fetchNaoLidas, 15000);
  return () => { cancelled = true; clearInterval(id); };
}, [user?.usu_id, isDev, openMenu]);
```

Aqui aparecem boas práticas já vistas: **`cancelled`** para ignorar respostas após desmontar,
**limpeza do `setInterval`**, e dependência em `openMenu` (reconsulta ao fechar um menu, p.ex.
após ler mensagens). É o mesmo espírito do polling do chat (Módulo 10): "bom o suficiente" para
um contador, sem precisar de socket.

---

## 4. Emitindo notificações: o painel como remetente

O painel pode **disparar** notificações pela API. O método
[enviarNotificacao](../../src/services/api.js#L451-L463) escolhe o endpoint pelo destinatário:

```jsx
async enviarNotificacao({ titulo, mensagem, usu_id } = {}) {
  if (usu_id) {
    return http.post('/api/notificacoes/enviar', { usu_id, noti_titulo: titulo, noti_descricao: mensagem });
  }
  return http.post('/api/admin/notificacoes/escola', { noti_titulo: titulo, noti_descricao: mensagem });
}
```

- **Com `usu_id`** → notifica **um** usuário específico.
- **Sem `usu_id`** → **broadcast** para a escola do Admin (o backend usa `per_escola_id` do JWT
  para o escopo — o front não passa a escola).

Isso é **regra de negócio na camada de serviço** (Módulo 08): o componente diz "para quem",
e o `api` decide a rota e traduz `titulo`/`mensagem` para `noti_titulo`/`noti_descricao`. A tela
[Notificacoes.jsx](../../src/pages/Notificacoes.jsx) existe para isso, mas hoje está
**desativada na rota** (comentada em [routes.jsx](../../src/router/routes.jsx#L189-L192) e no
menu do [Aside.jsx](../../src/components/Aside.jsx#L155-L160)) — um recurso pronto, aguardando
ser religado.

---

## 5. Tradução de erro e feedback

Notificações tocam o usuário, então o feedback importa. Erros de envio passam pela
sanitização do `http.js` (Módulo 05) antes de virar mensagem. Para o **resultado** (sucesso/
erro de envio), o padrão de UI é o do Módulo 12 (banners/inline). O importante: nunca mostrar
detalhe técnico cru numa notificação ao operador.

---

## 6. Como adicionar Web Push (Service Worker + Notifications API)

> **Não existe no projeto.** Este é o guia conceitual de "como você adicionaria".

**Web Push** entrega notificações do sistema **mesmo com a aba/app fechado**. Diferente do sino
in-app, exige **três** peças do navegador:

1. **Notifications API** — permissão e exibição:
   ```js
   const permissao = await Notification.requestPermission(); // 'granted' | 'denied' | 'default'
   if (permissao === 'granted') new Notification('Nova carona', { body: 'Você tem 1 solicitação' });
   ```
2. **Service Worker** — um script que roda em segundo plano, fora da página, e recebe os
   *pushes*:
   ```js
   // registro (na app)
   const reg = await navigator.serviceWorker.register('/sw.js');
   // dentro do sw.js
   self.addEventListener('push', (event) => {
     const data = event.data.json();
     event.waitUntil(self.registration.showNotification(data.titulo, { body: data.corpo }));
   });
   ```
3. **Push API + servidor com VAPID** — o cliente assina (`reg.pushManager.subscribe(...)`) e
   manda a *subscription* ao backend, que usa chaves **VAPID** para enviar pushes via serviço do
   navegador (FCM/Mozilla/Apple).

Pontos de atenção (valem como aprendizado):
- **HTTPS obrigatório** (Service Worker só funciona em contexto seguro; localhost é exceção).
- **Permissão é sensível**: peça no momento certo (após uma ação do usuário), nunca de cara —
  negações são difíceis de reverter.
- **iOS/Safari** tem restrições históricas a Web Push; teste por plataforma.
- Para um **painel administrativo de desktop**, Web Push raramente compensa — faz mais sentido
  no **app mobile** do usuário final. Por isso a ausência no painel é uma decisão coerente.

---

## 7. Efeito em performance e escala

- **Sino mockado**: custo zero de rede hoje (dados locais). Ao migrar para endpoint real, evite
  polling agressivo; prefira buscar ao abrir o dropdown + um intervalo moderado, ou socket se o
  volume justificar.
- **Polling de não lidas (15s)**: leve, mas multiplique por N usuários e por cada badge. Em
  escala, um único canal de socket entregaria contadores com menos tráfego.
- **Broadcast à escola**: a carga real fica no **backend** (fan-out para muitos usuários). O
  front só dispara uma requisição.
- **Web Push** (se adicionado): o Service Worker roda fora da thread principal — não trava a UI;
  mas exige infraestrutura (VAPID, armazenamento de subscriptions).

---

## Âncoras de leitura

1. Em [Topbar.jsx](../../src/components/Topbar.jsx), ache o badge do sino e a condição que o faz
   aparecer.
2. Em [Topbar.jsx](../../src/components/Topbar.jsx), siga o polling de `getNaoLidasSuporte`:
   intervalo, limpeza e por que `openMenu` está nas dependências.
3. Em [api.js](../../src/services/api.js), explique como `enviarNotificacao` decide entre
   notificar um usuário e a escola inteira.
4. Em [routes.jsx](../../src/router/routes.jsx) e [Aside.jsx](../../src/components/Aside.jsx),
   confirme que a tela de Notificações está comentada/desativada.
5. Em [mockData.js](../../src/data/mockData.js), encontre `notificationData` e descreva o shape
   de cada item consumido pela Topbar.

---

## Para aprofundar

**Documentação oficial:**
- MDN — *Notifications API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Notifications_API
- MDN — *Service Worker API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Service_Worker_API
- MDN — *Push API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Push_API
- web.dev — *Push notifications overview*: https://web.dev/articles/push-notifications-overview
- MDN — *Using the Notifications API*:
  https://developer.mozilla.org/pt-BR/docs/Web/API/Notifications_API/Using_the_Notifications_API

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"Web Push notifications português"**, **"Service Worker PWA pt-br"**,
  **"notificações navegador JavaScript"**.
- Canais: *Rocketseat* (PWA/Service Worker), *Willian Justen* (PWA), *Matheus Battisti – Hora
  de Codar*.

> **Ressalva**: APIs de Push/Service Worker mudam de suporte por navegador (especialmente
> Safari/iOS). Sempre cheque o *caniuse* e a MDN para o estado atual antes de seguir um vídeo —
> tutoriais antigos podem usar APIs depreciadas.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma notificação "in-app"?**
<details><summary>Resposta-modelo</summary>
É uma notificação exibida **dentro** da própria aplicação enquanto ela está aberta — como o sino
com contador na Topbar. Diferente de uma notificação do sistema operacional, ela some quando você
fecha o app e não depende de permissão do navegador.
</details>

**2. (Estudante) O que é um "badge" numa interface?**
<details><summary>Resposta-modelo</summary>
É um pequeno indicador visual (geralmente um número ou ponto colorido) sobreposto a um ícone para
sinalizar algo pendente — ex.: "3" no sino indicando 3 notificações novas, ou as mensagens de
suporte não lidas no projeto.
</details>

**3. (Júnior) Como funciona o "fechar dropdown ao clicar fora" do sino?**
<details><summary>Resposta-modelo</summary>
Um `useRef` referencia o container do menu; um listener de `mousedown` no `document` checa se o
clique foi **fora** desse container (`!ref.current.contains(e.target)`) e, se sim, fecha o menu.
O listener é adicionado num `useEffect` e removido na limpeza. É o padrão da
[Topbar.jsx](../../src/components/Topbar.jsx).
</details>

**4. (Júnior) Por que o contador de não lidas usa polling e quais cuidados o código tem?**
<details><summary>Resposta-modelo</summary>
Polling (15s) é simples e suficiente para um contador de baixo volume. Cuidados: flag `cancelled`
para não atualizar estado após desmontar; `clearInterval` na limpeza; e reconsulta quando um menu
fecha (`openMenu` nas dependências), para refletir mensagens recém-lidas. Em escala, socket
reduziria tráfego.
</details>

**5. (Pleno) Diferencie notificação in-app de Web Push e diga quando cada uma vale a pena.**
<details><summary>Resposta-modelo</summary>
In-app só aparece com o app aberto, não precisa de permissão e é simples (estado/endpoint). Web
Push usa Service Worker + Push API + VAPID e entrega notificações do sistema mesmo com a aba
fechada, exigindo permissão e HTTPS. In-app basta para um painel de desktop usado ativamente;
Web Push compensa quando é crítico alcançar o usuário fora do app (tipicamente no mobile do
usuário final, não no painel admin).
</details>

**6. (Pleno) Que cuidados de UX e técnicos um pedido de permissão de notificação exige?**
<details><summary>Resposta-modelo</summary>
UX: nunca pedir permissão "de cara" no load — pedir após uma ação que dê contexto ("ativar
avisos de novas caronas?"), pois uma negação é difícil de reverter e prejudica futuras tentativas.
Técnico: exige HTTPS, registrar Service Worker, lidar com os três estados (`granted`/`denied`/
`default`), e tratar plataformas com suporte parcial (iOS/Safari). Sempre ter um fallback in-app.
</details>

**7. (Pleno) O sino está mockado. Como você o migraria para tempo real de forma eficiente?**
<details><summary>Resposta-modelo</summary>
Trocaria `notificationData` por um endpoint (`GET /api/notificacoes` com paginação) carregado ao
abrir o dropdown, e o contador por uma fonte eficiente: idealmente um evento de **socket** (já há
infraestrutura Socket.IO no projeto) emitindo "nova notificação", em vez de polling agressivo.
Marcaria como lidas via endpoint, com **atualização otimista** no cliente (zera o badge na hora,
confirma com o servidor). Cacheria com React Query se adotado. Assim reduzo tráfego e mantenho o
contador instantâneo.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Central de notificações"**: um componente de sino avulso com dados fake.

1. Um `<NotificationBell>` com estado de `items` (fake) e `count` derivado dos não lidos.
2. Dropdown que abre/fecha e **fecha ao clicar fora** (use `useRef` + listener no `document`,
   com limpeza).
3. Botão "marcar todas como lidas" que zera o contador (atualização otimista).
4. **Bônus real (opcional)**: peça `Notification.requestPermission()` num botão e, se concedido,
   dispare uma `new Notification('Olá', { body: 'Teste' })`. Trate os três estados de permissão.

**Critério de sucesso**: o badge some quando tudo é lido; o dropdown fecha ao clicar fora sem
vazar listener (verifique com `console.count`); se fizer o bônus, a permissão é pedida só após
clique e o código lida com a negação.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar o componente de sino/dropdown, o "clicar fora", e o boilerplate de
  Service Worker/Push quando você decidir adicioná-lo.
- **Onde atrapalha**: a IA tende a pedir permissão de notificação no carregamento (péssima UX),
  esquecer limpeza de listeners/intervalos, e gerar código de Web Push sem mencionar HTTPS/VAPID
  ou as restrições do Safari/iOS. Pode também sugerir polling onde socket seria melhor (ou vice-
  versa).
- **Decisão sua**: **quando** pedir permissão, **in-app × Web Push**, e **polling × socket** são
  decisões de UX/arquitetura. Para este painel, reconhecer que Web Push provavelmente não vale a
  pena (é desktop, atrás de login) é o tipo de julgamento que você deve fazer — não a IA.
