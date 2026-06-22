# Módulo 11 — Notificações

> **Objetivo**: entender o que existe **hoje** de notificação no painel — o **badge de "não
> lidas" do suporte** na Topbar (in-app, via polling) — e o que foi **descontinuado** (o sino
> in-app e a tela de emissão, prototipados e depois removidos). No fim, ver **como adicionar Web
> Push** (notificações do navegador via Service Worker), que o projeto **não** usa.

**Arquivos cobertos:**
- [src/components/Topbar.jsx](../../src/components/Topbar.jsx) — badge de suporte (polling)
- [src/services/api.js](../../src/services/api.js#L126-L134) — `getNaoLidasSuporte` (badge)

> **Nota histórica.** Versões iniciais tinham um **sino de notificações** in-app alimentado por
> um mock (`notificationData` em `src/data/mockData.js`) e uma tela de **emissão**
> (`Notificacoes.jsx` + `api.enviarNotificacao`). Esses itens foram **removidos**: o mock não
> existe mais, a Topbar não tem mais o sino e a rota de Notificações está comentada. Este módulo
> mantém a parte que está **viva** (o badge de suporte) e o guia conceitual de Web Push.

---

## 1. Tipos de notificação (conceito)

A palavra "notificação" mistura conceitos diferentes:

1. **Notificação in-app**: algo exibido **dentro** da aplicação enquanto ela está aberta — um
   contador, um badge, um dropdown. Some quando você fecha o painel.
2. **Badge de não lidas**: um contador numérico que sinaliza pendências (ex.: mensagens de
   suporte não lidas). É a forma in-app que o projeto **usa hoje**.
3. **Web Push**: notificações do sistema operacional/navegador que chegam **mesmo com a aba
   fechada**. O projeto **não** tem — é a seção 4 (conceitual).

> O **sino** in-app (item de "notificações recentes") foi removido; o único indicador in-app
> ativo é o badge de suporte (seção 2).

---

## 2. Badge de "não lidas" do suporte (com polling) — o que existe hoje

No botão de suporte da [Topbar.jsx](../../src/components/Topbar.jsx), um contador mostra quantas
mensagens de suporte estão **não lidas**. Ele é buscado por **polling leve** a cada 15s:

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

Boas práticas presentes aqui: **`cancelled`** para ignorar respostas após desmontar, **limpeza
do `setInterval`**, e dependência em `openMenu` (reconsulta ao fechar um menu — p.ex. após ler
mensagens). É o mesmo espírito do polling do chat (Módulo 10): "bom o suficiente" para um
contador, sem precisar de socket.

Padrões React em ação (revisão dos Módulos 02-03):
- **Renderização condicional** do badge (só aparece quando há não lidas).
- **Clique fora fecha o menu**: um `useRef` (`rightRef`) + listener de `mousedown` no `document`
  ([Topbar.jsx](../../src/components/Topbar.jsx)) — padrão clássico de dropdown.

---

## 3. O que foi removido (e por quê)

- **Sino in-app + `notificationData` (mock):** o sino listava itens fictícios vindos de
  `mockData.js`. Como nunca houve endpoint real de notificações in-app e o mock foi removido na
  limpeza geral, o sino saiu da Topbar — que hoje tem apenas **suporte** e **logout**.
- **Tela de emissão (`Notificacoes.jsx`) + `api.enviarNotificacao`:** a ideia era o painel
  **disparar** uma notificação para um usuário ou para a escola inteira. O recurso ficou
  comentado na rota e acabou removido junto com o mock — não há endpoint correspondente hoje.

> Lição: recursos "prototipados com mock" precisam de uma decisão clara — **religar com backend
> real** ou **remover**. Deixar código morto/desativado por muito tempo gera documentação
> enganosa (como esta seção precisou corrigir).

---

## 4. Como adicionar Web Push (Service Worker + Notifications API)

> **Não existe no projeto.** Guia conceitual de "como você adicionaria".

**Web Push** entrega notificações do sistema **mesmo com a aba/app fechado**. Exige **três**
peças do navegador:

1. **Notifications API** — permissão e exibição:
   ```js
   const permissao = await Notification.requestPermission(); // 'granted' | 'denied' | 'default'
   if (permissao === 'granted') new Notification('Nova carona', { body: 'Você tem 1 solicitação' });
   ```
2. **Service Worker** — script que roda em segundo plano e recebe os *pushes*:
   ```js
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

Pontos de atenção:
- **HTTPS obrigatório** (Service Worker só roda em contexto seguro; localhost é exceção).
- **Permissão é sensível**: peça após uma ação do usuário, nunca de cara — negações são difíceis
  de reverter.
- **iOS/Safari** tem restrições históricas a Web Push; teste por plataforma.
- Para um **painel administrativo de desktop**, Web Push raramente compensa — faz mais sentido no
  **app mobile** do usuário final. Por isso a ausência no painel é uma decisão coerente.

---

## 5. Efeito em performance e escala

- **Polling de não lidas (15s)**: leve, mas multiplique por N usuários e por cada badge. Em
  escala, um único canal de socket entregaria contadores com menos tráfego.
- **Web Push** (se adicionado): o Service Worker roda fora da thread principal — não trava a UI;
  mas exige infraestrutura (VAPID, armazenamento de subscriptions).

---

## Âncoras de leitura

1. Em [Topbar.jsx](../../src/components/Topbar.jsx), ache o badge de suporte e a condição que o
   faz aparecer.
2. Em [Topbar.jsx](../../src/components/Topbar.jsx), siga o polling de `getNaoLidasSuporte`:
   intervalo, limpeza e por que `openMenu` está nas dependências.
3. Explique, com base na seção 3, por que o sino in-app e a tela de emissão foram removidos.

---

## Para aprofundar

**Documentação oficial:**
- MDN — *Notifications API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Notifications_API
- MDN — *Service Worker API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Service_Worker_API
- MDN — *Push API*: https://developer.mozilla.org/pt-BR/docs/Web/API/Push_API
- web.dev — *Push notifications overview*: https://web.dev/articles/push-notifications-overview

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"Web Push notifications português"**, **"Service Worker PWA pt-br"**,
  **"notificações navegador JavaScript"**.
- Canais: *Rocketseat* (PWA/Service Worker), *Willian Justen* (PWA), *Matheus Battisti – Hora de
  Codar*.

> **Ressalva**: APIs de Push/Service Worker mudam de suporte por navegador (especialmente
> Safari/iOS). Sempre cheque o *caniuse* e a MDN antes de seguir um vídeo.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma notificação "in-app"?**
<details><summary>Resposta-modelo</summary>
É uma notificação exibida **dentro** da própria aplicação enquanto ela está aberta — como o badge
de não lidas do suporte na Topbar. Diferente de uma notificação do sistema operacional, ela some
quando você fecha o app e não depende de permissão do navegador.
</details>

**2. (Estudante) O que é um "badge" numa interface?**
<details><summary>Resposta-modelo</summary>
É um pequeno indicador visual (geralmente um número ou ponto colorido) sobreposto a um ícone para
sinalizar algo pendente — ex.: as mensagens de suporte não lidas no projeto.
</details>

**3. (Júnior) Como funciona o "fechar dropdown ao clicar fora"?**
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
UX: nunca pedir permissão "de cara" no load — pedir após uma ação que dê contexto ("ativar avisos
de novas caronas?"), pois uma negação é difícil de reverter. Técnico: exige HTTPS, registrar
Service Worker, lidar com os três estados (`granted`/`denied`/`default`), e tratar plataformas com
suporte parcial (iOS/Safari). Sempre ter um fallback in-app.
</details>

**7. (Pleno) Se fosse religar as notificações in-app, como faria de forma eficiente?**
<details><summary>Resposta-modelo</summary>
Criaria um endpoint real (`GET /api/notificacoes` com paginação) carregado ao abrir o dropdown, e
o contador viria de uma fonte eficiente: idealmente um evento de **socket** (já há infraestrutura
Socket.IO no projeto) emitindo "nova notificação", em vez de polling agressivo. Marcaria como
lidas via endpoint, com **atualização otimista** no cliente (zera o badge na hora, confirma com o
servidor). Assim reduzo tráfego e mantenho o contador instantâneo.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Central de notificações"**: um componente de sino avulso com dados fake (exercício isolado —
não precisa existir no projeto).

1. Um `<NotificationBell>` com estado de `items` (fake) e `count` derivado dos não lidos.
2. Dropdown que abre/fecha e **fecha ao clicar fora** (use `useRef` + listener no `document`, com
   limpeza).
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
  ou as restrições do Safari/iOS. Pode também sugerir polling onde socket seria melhor (ou
  vice-versa).
- **Decisão sua**: **quando** pedir permissão, **in-app × Web Push**, e **polling × socket** são
  decisões de UX/arquitetura. Para este painel, reconhecer que Web Push provavelmente não vale a
  pena (é desktop, atrás de login) é o tipo de julgamento que você deve fazer — não a IA.
