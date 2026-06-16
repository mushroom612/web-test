# Módulo 06 — Autenticação e sessão

> **Objetivo**: entender o ciclo de vida de uma sessão no painel: como o **login** troca
> credenciais por **tokens** (JWT), onde eles são guardados, como a sessão é **re-hidratada**
> ao recarregar a página, como funciona o **refresh** automático e o **logout** global, e como
> o papel do usuário (Admin/Dev) controla o acesso. Também cobre o fluxo de **recuperação de
> senha** com OTP.

**Arquivos cobertos:**
- [src/context/AuthContext.jsx](../../src/context/AuthContext.jsx) — estado da sessão
- [src/services/http.js](../../src/services/http.js) — armazenamento de tokens + refresh
- [src/services/api.js](../../src/services/api.js#L29-L94) — login/logout/me + recuperação
- [src/pages/Login.jsx](../../src/pages/Login.jsx) — tela de login e fluxo de OTP
- [src/router/routes.jsx](../../src/router/routes.jsx) — guardas (ver Módulo 04)

> **Contrato**: `POST /api/usuarios/login` → `{ access_token, refresh_token, user }`;
> `GET /api/usuarios/me` → perfil; `POST /api/usuarios/refresh` → novos tokens;
> `POST /api/usuarios/logout` → invalida no servidor.

---

## 1. O conceito: JWT, access e refresh

**JWT** (*JSON Web Token*) é um token assinado pelo servidor que prova "este é o usuário X com
papel Y", sem o servidor guardar sessão em memória. O projeto usa **dois** tokens:

- **access token**: curta duração; enviado em **toda** requisição no header
  `Authorization: Bearer <access>`. Se vaza, expira logo.
- **refresh token**: longa duração; serve **só** para obter um novo access quando ele expira.

Esse par é o padrão da indústria: equilibra segurança (access curto) e conveniência (não
relogar toda hora, graças ao refresh).

---

## 2. Onde os tokens moram: `localStorage`

O helper [`tokens`](../../src/services/http.js#L40-L55) centraliza leitura/escrita no
**`localStorage`** do navegador:

```js
const ACCESS_KEY = "auth_token";
const REFRESH_KEY = "refresh_token";
export const tokens = {
  get()  { return { access: localStorage.getItem(ACCESS_KEY), refresh: localStorage.getItem(REFRESH_KEY) }; },
  set({ access, refresh }) { if (access) localStorage.setItem(ACCESS_KEY, access); if (refresh) localStorage.setItem(REFRESH_KEY, refresh); },
  clear() { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); },
};
```

Centralizar é uma boa prática: nenhuma outra parte do código toca `localStorage` com strings
soltas (evita *typos* nas chaves).

### `localStorage` × cookies (o trade-off de segurança)

| Critério | `localStorage` (escolhido) | Cookie `HttpOnly` |
| --- | --- | --- |
| Acesso por JS | Sim (fácil de usar) | Não (mais seguro contra XSS) |
| Enviado automático | Não (você anexa no header) | Sim (com a requisição) |
| Vulnerável a XSS | **Sim** (script malicioso lê o token) | Mitigado |
| Vulnerável a CSRF | Não | Sim (precisa de proteção) |

`localStorage` é simples e comum em SPAs, mas se houver uma falha de **XSS** o token pode ser
roubado. Cookies `HttpOnly` protegem contra isso, ao custo de cuidar de CSRF e de o backend
setar/ler cookies. Para um painel interno, a escolha por `localStorage` é pragmática — mas é
um ponto a revisitar em produção (anote no seu backlog de segurança).

---

## 3. Login: trocar credenciais por sessão

O fluxo começa no [Login.jsx](../../src/pages/Login.jsx#L56-L68):

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(''); setLoading(true);
  try {
    await login(email, password);   // vem do AuthContext
    navigate('/dashboard');
  } catch (err) {
    setError(err.message || 'Email ou senha inválidos.');
  } finally { setLoading(false); }
};
```

A página **não** fala com a API diretamente; chama `login()` do contexto. Esse `login`
([AuthContext.jsx](../../src/context/AuthContext.jsx#L77-L89)) faz três coisas:

```jsx
const login = useCallback(async (email, password) => {
  await api.login(email, password);            // 1. autentica e salva tokens
  const me = await api.getMe();                // 2. busca o perfil
  const role = Number(me?.per_tipo ?? 0);
  if (role < 1) {                              // 3. valida o papel
    await api.logout().catch(() => {});
    throw new Error(NO_ADMIN_ACCESS_MSG);      // usuário comum é barrado
  }
  setUser(me);
  return me;
}, []);
```

Repare na **regra de negócio**: um usuário comum (papel 0) **consegue** se autenticar, mas é
**expulso** do painel (que é só para Admin/Dev). A validação acontece no front *e* no backend
— defesa em camadas. O `api.login` por baixo faz `POST /api/usuarios/login` e salva os tokens
([api.js](../../src/services/api.js#L32-L43)).

---

## 4. Re-hidratação: continuar logado após recarregar

Quando você dá F5, o React começa do zero — mas o token continua no `localStorage`. O
[AuthProvider](../../src/context/AuthContext.jsx#L44-L64) re-hidrata a sessão no boot:

```jsx
useEffect(() => {
  let cancelled = false;
  async function hydrate() {
    const { access } = tokens.get();
    if (!access) { setLoading(false); return; }      // sem token → não logado
    try {
      const me = await api.getMe();                  // valida o token buscando o perfil
      if (!cancelled) setUser(me);
    } catch {
      tokens.clear();                                // token inválido → limpa
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  hydrate();
  return () => { cancelled = true; };
}, []);
```

Detalhes importantes:
- **`loading`** começa `true` e só vira `false` quando sabemos se há sessão. É o que impede o
  `PrivateRoute` de jogar um usuário válido para o login (o "flash" — Módulos 01 e 04).
- **`cancelled`** protege contra a montagem dupla do StrictMode e contra o componente
  desmontar no meio da chamada (evita `setState` em componente desmontado).

---

## 5. Refresh automático e logout global

Quando o access expira, o servidor responde **401**. O [http.js](../../src/services/http.js)
intercepta, faz **um** refresh e repete a chamada (detalhado no [Módulo 05](./05-camada-de-api.md#4-autenticação-transparente-e-refresh-automático)). Se o refresh **falha**, o token é
limpo e dispara-se um evento global:

```js
// http.js
window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "refresh-failed" } }));
```

E o [AuthContext](../../src/context/AuthContext.jsx#L68-L72) escuta esse evento para zerar a UI:

```jsx
useEffect(() => {
  const handler = () => setUser(null);
  window.addEventListener('auth:logout', handler);
  return () => window.removeEventListener('auth:logout', handler);
}, []);
```

Por que um **evento** em vez de chamar o contexto direto? Porque o `http.js` é uma camada
baixa que **não deve** conhecer o React/contexto. O `CustomEvent` no `window` desacopla as
camadas — padrão **pub/sub**. Resultado: a sessão expira → a UI volta ao login sozinha, sem o
`http.js` importar nada do React.

O **logout manual** ([AuthContext.jsx](../../src/context/AuthContext.jsx#L92-L95)) chama
`api.logout()` (que invalida no servidor *best-effort* e limpa os tokens) e zera o `user`. As
telas chamam `logout()` e então `navigate('/')` ([Aside.jsx](../../src/components/Aside.jsx#L76-L79),
[Topbar.jsx](../../src/components/Topbar.jsx)).

---

## 6. O papel (role) e o que o resto do app lê

O valor exposto pelo contexto deriva `role` de `per_tipo`
([AuthContext.jsx](../../src/context/AuthContext.jsx#L97-L107)):

```jsx
const role = Number(user?.per_tipo ?? 0);
const value = {
  user, loading,
  isAuthenticated: !!user,
  role,
  isAdmin: role === 1,
  isDev: role === 2,
  login, logout,
};
```

Todo o resto do app consome isso via `useAuth()`: o `PrivateRoute`/`DevRoute` (Módulo 04), o
filtro de menu do `Aside` (Módulo 04), e textos que mudam por papel (ex.: o `Aside` mostra
"Denúncias" para Admin e "Sugestões/Denúncias" para Dev). **Uma** fonte de verdade para o
papel — mudou ali, mudou em todo lugar.

---

## 7. Recuperação de senha (fluxo de OTP)

O [Login.jsx](../../src/pages/Login.jsx) também implementa "Esqueci a senha" como uma
**máquina de estados** de 4 etapas (`forgotStep`): 1) e-mail → 2) código OTP → 3) nova senha
→ 4) sucesso. Cada etapa chama um método de API **sem autenticação** (`auth: false`):

- `api.forgotPassword(email)` → `POST /api/usuarios/forgot-password` (envia OTP de 6 dígitos).
  O backend **sempre** responde 200, mesmo se o e-mail não existir — para **não revelar** quais
  e-mails estão cadastrados (boa prática de privacidade).
- `api.verificarOtpReset(email, otp)` → valida o código (200/401/410).
- `api.resetPassword(email, otp, novaSenha)` → troca a senha (mín. 8 caracteres).

O detalhe de UX dos 6 inputs de OTP (foco automático, colar, backspace) está em
[handleOtpChange/KeyDown/Paste](../../src/pages/Login.jsx#L141-L163) e usa `useRef` para
controlar o foco — assunto aprofundado no Módulo 09 (formulários).

---

## 8. Efeito em performance

- A re-hidratação custa **uma** requisição (`/me`) no boot — barata e necessária.
- O `refreshInflight` (Módulo 05) evita múltiplos refreshes simultâneos.
- `localStorage` é **síncrono**: leituras são instantâneas, mas evite escrever em massa em
  loops (não é o caso aqui).
- O evento `auth:logout` é global e leve; só há um listener no provider.

---

## Âncoras de leitura

1. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), siga o `login`: em que momento um
   usuário comum (papel 0) é barrado e como?
2. Em [AuthContext.jsx](../../src/context/AuthContext.jsx), explique por que `loading` começa
   `true` e o que aconteceria se começasse `false`.
3. Em [http.js](../../src/services/http.js), encontre onde o evento `auth:logout` é disparado e,
   em [AuthContext.jsx](../../src/context/AuthContext.jsx), onde ele é ouvido.
4. Em [http.js](../../src/services/http.js), aponte as chaves do `localStorage` usadas e por que
   centralizá-las no helper `tokens`.
5. Em [Login.jsx](../../src/pages/Login.jsx), mapeie as 4 etapas de `forgotStep` aos métodos de
   API chamados em cada uma.

---

## Para aprofundar

**Documentação oficial / referência:**
- MDN — *Window: localStorage*: https://developer.mozilla.org/pt-BR/docs/Web/API/Window/localStorage
- MDN — *CustomEvent*: https://developer.mozilla.org/pt-BR/docs/Web/API/CustomEvent
- jwt.io (anatomia de um JWT): https://jwt.io/introduction
- OWASP — *JWT / Session* cheat sheets: https://cheatsheetseries.owasp.org/
- React — *useContext*: https://react.dev/reference/react/useContext

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"autenticação JWT React pt-br"**, **"refresh token React"** e **"rota privada
  React Router"**.
- Canais: *Rocketseat* (auth com JWT/refresh), *Matheus Battisti – Hora de Codar*,
  *Fernanda Kipper | Dev*.

> **Ressalva**: fluxos de auth variam muito por backend. Use os vídeos para a **intuição**
> (access × refresh, guardas), mas o **contrato real** é o do seu servidor — confira os nomes
> de campo (`access_token`, `refresh_token`, `per_tipo`) no [api.js](../../src/services/api.js).

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é "estar autenticado" numa aplicação web?**
<details><summary>Resposta-modelo</summary>
É o sistema ter confirmado a identidade do usuário (geralmente via login com e-mail/senha) e
manter uma prova disso (um token ou sessão) que acompanha as próximas requisições, para o
servidor saber quem está pedindo o quê.
</details>

**2. (Estudante) O que é o `localStorage`?**
<details><summary>Resposta-modelo</summary>
É um armazenamento chave-valor do navegador, por origem (domínio), que persiste mesmo após
fechar a aba/navegador. Guarda strings e é acessível por JavaScript. No projeto, guarda o
`auth_token` e o `refresh_token`.
</details>

**3. (Júnior) Qual a diferença entre access token e refresh token?**
<details><summary>Resposta-modelo</summary>
O access token é de curta duração e vai em toda requisição (no header Authorization) para
provar a identidade; se vazar, expira logo. O refresh token é de longa duração e serve só para
obter um novo access quando ele expira, evitando relogar. Separar os dois limita o dano de um
vazamento do access.
</details>

**4. (Júnior) Como o app continua logado depois de um F5?**
<details><summary>Resposta-modelo</summary>
O token fica no `localStorage`, que sobrevive ao reload. No boot, o `AuthProvider` lê o token e
chama `GET /api/usuarios/me` para validar e recarregar o perfil
([AuthContext.jsx](../../src/context/AuthContext.jsx#L44)). Enquanto isso, `loading` evita
redirecionar para o login. Se o token for inválido, limpa e trata como deslogado.
</details>

**5. (Pleno) Por que usar um evento `auth:logout` em vez de o `http.js` chamar o contexto
diretamente?**
<details><summary>Resposta-modelo</summary>
Para **desacoplar camadas**: o `http.js` é infraestrutura de rede e não deve depender do React
nem do `AuthContext` (evita import circular e acoplamento). Disparar um `CustomEvent` no
`window` (pub/sub) permite que qualquer interessado — aqui o `AuthContext` — reaja, sem o
`http.js` conhecer quem ouve. Facilita testar e trocar a camada de UI.
</details>

**6. (Pleno) Quais riscos o uso de `localStorage` para tokens traz e como mitigá-los?**
<details><summary>Resposta-modelo</summary>
Principal risco: **XSS** — se um script malicioso rodar na página, ele lê o token. Mitigações:
prevenir XSS (escapar saída, CSP, dependências confiáveis), usar access tokens de vida curta,
e considerar mover o refresh para cookie `HttpOnly`+`Secure`+`SameSite` (protegido de JS),
tratando então CSRF. Também: nunca logar tokens, e invalidar no servidor no logout. Em produção,
cookies HttpOnly costumam ser preferíveis.
</details>

**7. (Pleno) Por que o `forgot-password` sempre retorna 200, mesmo para e-mail inexistente?**
<details><summary>Resposta-modelo</summary>
Para evitar **enumeração de usuários**: se a resposta diferenciasse "e-mail existe" de "não
existe", um atacante descobriria quais e-mails estão cadastrados. Respondendo sempre igual (e
só enviando o OTP se existir), não se vaza essa informação. É uma decisão de privacidade/segurança
implementada no backend e respeitada pela UI ([api.js](../../src/services/api.js#L69)).
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Sessão fake com guarda e refresh simulado"**: app React avulso, sem backend real.

1. Um `AuthContext` com `user`, `loading`, `login(email)`, `logout()`. No `login`, salve um
   "token" fake no `localStorage` e um `user` com um `papel`.
2. Re-hidrate no boot: ao montar, leia o `localStorage` e restaure o `user`, com `loading` até
   terminar.
3. Uma `RotaPrivada` que respeita o `loading` (mostra "Carregando...") antes de decidir.
4. Simule expiração: um botão "expirar sessão" que dispara um `CustomEvent('auth:logout')`; o
   contexto ouve e zera o `user`, voltando para o login.

**Critério de sucesso**: após "login", recarregar a página mantém você logado; "expirar sessão"
volta ao login automaticamente; a rota privada nunca pisca o login para um usuário válido.

---

## IA no fluxo de trabalho

- **Onde acelera**: montar o esqueleto do `AuthContext`, escrever a tela de login, gerar o
  fluxo de OTP e explicar conceitos de JWT/refresh.
- **Onde atrapalha**: a IA frequentemente sugere guardar tokens de forma insegura, esquece o
  estado `loading` (causando o flash de login), implementa refresh sem proteção de concorrência,
  e mistura camadas (faz o cliente HTTP importar o contexto). Pode também propor libs de auth
  pesadas sem necessidade.
- **Decisão sua**: **onde guardar o token** (localStorage × cookie HttpOnly), a **política de
  expiração** e as **regras de papel** são decisões de segurança/produto. Decida-as
  conscientemente — é o tipo de coisa que um TCC/entrevista vai cobrar que você justifique.
