# Módulo 09 — Formulários e fluxos

> **Objetivo**: dominar formulários no React — **inputs controlados**, validação, `onSubmit`
> com `preventDefault`, botões que desabilitam durante o envio, e **fluxos de múltiplas
> etapas** modelados como máquina de estados. Também ver o uso de `useRef` para controlar foco
> (os campos de OTP). Tudo ancorado no formulário mais rico do projeto: o de login/recuperação.

**Arquivos cobertos:**
- [src/pages/Login.jsx](../../src/pages/Login.jsx) — login + recuperação de senha (4 etapas, OTP)
- [src/pages/Usuarios.jsx](../../src/pages/Usuarios.jsx#L227-L238) — campo de busca controlado
- [src/components/UserProfilePanel.jsx](../../src/components/UserProfilePanel.jsx) — formulário de edição
- [src/pages/Cadastrar.jsx](../../src/pages/Cadastrar.jsx) — fluxo de criação de instituição

---

## 1. Input controlado: o React é a fonte da verdade

Já vimos o conceito no Módulo 03; aqui aprofundamos. Um input **controlado** tem seu `value`
ligado ao estado e um `onChange` que atualiza esse estado. O
[Login.jsx](../../src/pages/Login.jsx#L196-L205) mostra o padrão:

```jsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoFocus
/>
```

Fluxo circular: digito → evento → `setEmail` → re-render → `value` reflete o estado. Vantagens:
- O estado **sempre** espelha o que está na tela (dá para validar, formatar, comparar).
- Permite **derivar** UI do valor: o botão "Entrar" fica `disabled` enquanto `loading`
  ([L242](../../src/pages/Login.jsx#L242)); o de OTP fica `disabled` até ter 6 dígitos
  ([L326](../../src/pages/Login.jsx#L326)).

### Mostrar/ocultar senha

Um padrão clássico ([Login.jsx](../../src/pages/Login.jsx#L211-L227)): um estado booleano
`showPassword` troca o `type` do input entre `'password'` e `'text'`, e um botão alterna o
estado. É UI derivada de estado, sem tocar no DOM manualmente.

---

## 2. Submissão: `<form onSubmit>` + `preventDefault`

O envio usa um `<form>` de verdade com `onSubmit`, não um `onClick` no botão. Em
[Login.jsx](../../src/pages/Login.jsx#L56-L68):

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();          // impede o reload nativo do navegador
  setError(''); setLoading(true);
  try {
    await login(email, password);
    navigate('/painel');
  } catch (err) {
    setError(err.message || 'Email ou senha inválidos.');
  } finally {
    setLoading(false);         // sempre reabilita o botão, deu certo ou não
  }
};
```

Por que `<form onSubmit>` em vez de `onClick`?
- Aceita **Enter** no teclado automaticamente (acessibilidade).
- `e.preventDefault()` evita o comportamento padrão do HTML (recarregar a página).
- Semântica correta: o `<button type="submit">` dispara o submit.

O par `setLoading(true)` no início + `setLoading(false)` no `finally` é o padrão para impedir
**duplo envio** (o botão fica `disabled` enquanto envia) e dar feedback ("Entrando...").

---

## 3. Validação

A validação aqui é **manual e pontual**, feita antes da chamada de API. Exemplos no
[Login.jsx](../../src/pages/Login.jsx):
- OTP precisa ter 6 dígitos ([L106-L109](../../src/pages/Login.jsx#L103-L109)):
  `if (otp.length < 6) { setForgotError('Digite todos os 6 dígitos...'); return; }`
- Senha nova com mínimo 8 ([L124-L127](../../src/pages/Login.jsx#L122-L127)).

Há também validação **declarativa** via atributos HTML: `type="email"` (formato de e-mail) e
`required` ([L286](../../src/pages/Login.jsx#L286)). O navegador valida esses de graça.

> Estratégia do projeto: validação leve no cliente para UX rápida, mas a **autoridade** é o
> backend (mensagens de erro vêm de lá e são tratadas no `catch`). Nunca confie só no cliente
> — validação de cliente é conveniência; a de servidor é segurança.

---

## 4. Fluxo de múltiplas etapas como máquina de estados

A recuperação de senha é um **wizard** de 4 passos, modelado com um único número de estado,
`forgotStep` ([Login.jsx](../../src/pages/Login.jsx#L17-L18)):

```
forgotStep: 1 (e-mail) → 2 (código OTP) → 3 (nova senha) → 4 (sucesso)
```

Cada etapa renderiza condicionalmente seu próprio `<form>`
([L272, L301, L334, L371](../../src/pages/Login.jsx#L272)) e, ao concluir, **avança** o passo:

```jsx
async function handleForgotEmailSubmit(e) {
  e.preventDefault();
  setForgotLoading(true);
  try {
    await api.forgotPassword(forgotEmail);
    setForgotStep(2);              // avança para a etapa do OTP
  } catch (err) {
    setForgotError(err.message || 'Erro ao enviar o código.');
  } finally { setForgotLoading(false); }
}
```

Há também **transições automáticas** via `useEffect`:
- Ao entrar na etapa 2, foca o primeiro campo de OTP após 60ms
  ([L37-L42](../../src/pages/Login.jsx#L37-L42)).
- Na etapa 4 (sucesso), aguarda 2,5s e volta para o login
  ([L45-L53](../../src/pages/Login.jsx#L45-L53)).

Modelar fluxo com um estado explícito (em vez de vários booleanos `isStep1`, `isStep2`) é mais
limpo: só **um** valor é válido por vez, e a renderização é um mapeamento direto
`forgotStep → form`.

> O `Cadastrar.jsx` (criação de instituição) é outro fluxo de múltiplas etapas — cria escola,
> vincula admin e define contrato, encadeando `api.createSchool` → `api.createUser`/
> `updateUserProfile` → `api.createContract`. Vale ler como segundo exemplo de orquestração de
> chamadas dependentes.

---

## 5. `useRef` para foco: os 6 campos de OTP

Às vezes você precisa de uma referência **direta** a um nó do DOM — por exemplo, para chamar
`.focus()`. É o caso dos 6 inputs de OTP. O [Login.jsx](../../src/pages/Login.jsx#L26) guarda
um array de refs:

```jsx
const otpRefs = useRef([]);
// no JSX, cada input registra seu nó:
<input ref={(el) => { otpRefs.current[i] = el; }} ... />
```

A UX é cuidadosa ([handleOtpChange/KeyDown/Paste](../../src/pages/Login.jsx#L141-L163)):
- Digitar um dígito **avança** o foco para o próximo campo.
- **Backspace** num campo vazio volta ao anterior.
- **Colar** um código de 6 dígitos distribui um por campo e foca o último.

Repare: cada `otpValue` é estado **controlado** (o valor), mas o **foco** é imperativo (via
ref). Essa é a divisão certa — `value` é declarativo; `.focus()` é uma ação imperativa no DOM
que o React não modela por estado.

---

## 6. Alternativas: bibliotecas de formulário

O projeto faz tudo "na mão" com `useState`. Em formulários maiores, isso escala mal (muitos
estados, validação repetida). Alternativas:

| Abordagem | Prós | Contras | No projeto |
| --- | --- | --- | --- |
| **`useState` controlado** (atual) | Zero deps, transparente, ótimo p/ forms pequenos | Verboso, validação manual, re-render a cada tecla | Usado |
| **React Hook Form** | Performático (inputs não-controlados via ref), menos re-render, validação integrada | Curva, API própria | Não usado |
| **Formik** | Maduro, popular | Mais re-renders, +bundle, menos ativo | Não usado |
| **+ Zod / Yup** (schema) | Validação declarativa e reutilizável, tipagem | +conceito | Não usado |

Para o login (3-4 campos) o `useState` é perfeitamente adequado. Se surgisse um formulário de
20 campos com validação complexa, **React Hook Form + Zod** seria o salto natural: menos
re-renders (RHF usa inputs não-controlados por padrão) e validação por schema reaproveitável.

---

## 7. Como isso conversa com a API e o banco

Cada `handle*Submit` chama um método do `api` e trata o resultado:
- **Login**: `login()` (contexto) → `api.login` → `POST /api/usuarios/login` (Módulo 06).
- **Recuperação**: `api.forgotPassword`, `api.verificarOtpReset`, `api.resetPassword` — todos
  com `auth: false` (sem token, faz sentido: o usuário não está logado).
- **Erros do backend** chegam como `ApiError` e viram mensagem na tela via `catch` (Módulo 05).
- **Campos amigáveis** (`email`, `senha`, `novaSenha`) são traduzidos para o contrato
  (`usu_email`, `usu_senha`, `nova_senha`) na camada de serviço (Módulo 08).

O fluxo de OTP reflete um **contrato de segurança** do backend: 6 dígitos, expira em 15 min,
e o `forgot-password` sempre retorna 200 para não revelar e-mails cadastrados (Módulo 06).

---

## Âncoras de leitura

1. Em [Login.jsx](../../src/pages/Login.jsx), prove que o campo de e-mail é controlado e ache
   onde o botão "Entrar" é desabilitado durante o envio.
2. Em [Login.jsx](../../src/pages/Login.jsx), siga `forgotStep` de 1 a 4: o que renderiza cada
   valor e qual chamada de API avança o passo.
3. Em [Login.jsx](../../src/pages/Login.jsx), encontre a transição automática que volta ao
   login após o sucesso — quanto tempo espera e como faz a limpeza do timer?
4. Em [Login.jsx](../../src/pages/Login.jsx), explique por que o foco dos OTPs usa `useRef` em
   vez de estado.
5. Em [Login.jsx](../../src/pages/Login.jsx), liste as validações de cliente e diga quais são
   declarativas (HTML) e quais são manuais (JS).

---

## Para aprofundar

**Documentação oficial:**
- React — *Reacting to Input with State* (forms):
  https://react.dev/learn/reacting-to-input-with-state
- React — *Manipulating the DOM with Refs* (`useRef`):
  https://react.dev/learn/manipulating-the-dom-with-refs
- MDN — *Client-side form validation*:
  https://developer.mozilla.org/pt-BR/docs/Learn/Forms/Form_validation
- React Hook Form: https://react-hook-form.com/ · Zod: https://zod.dev/

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"formulários controlados React pt-br"**, **"React Hook Form português"**,
  **"validação de formulário React Zod pt-br"**.
- Canais: *Matheus Battisti – Hora de Codar* (forms no React), *Rocketseat* (RHF + Zod),
  *Fernanda Kipper | Dev*.

> **Ressalva**: confira a versão — o React 19 trouxe novidades de formulário (Actions,
> `useActionState`, `useFormStatus`). O projeto **não** as usa (segue o padrão clássico
> controlado). Vídeos muito novos podem ensinar Actions; saiba que aqui é `useState` + `onSubmit`.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é um formulário controlado?**
<details><summary>Resposta-modelo</summary>
É aquele em que o valor do campo vem do estado React (`value={estado}`) e cada mudança passa por
um `onChange` que atualiza o estado. O React vira a "fonte da verdade" do valor, em vez do DOM.
</details>

**2. (Estudante) Para que serve `event.preventDefault()` no submit de um formulário?**
<details><summary>Resposta-modelo</summary>
Para impedir o comportamento padrão do navegador ao enviar um `<form>`, que é recarregar/navegar
a página. Numa SPA queremos tratar o envio em JavaScript (chamar a API e atualizar a UI) sem
recarregar, então chamamos `e.preventDefault()` no início do handler.
</details>

**3. (Júnior) Qual a diferença entre input controlado e não-controlado? Quando usar cada um?**
<details><summary>Resposta-modelo</summary>
Controlado: valor no estado React, com `value`+`onChange` — fácil validar/derivar UI, re-renderiza
a cada tecla. Não-controlado: valor mora no DOM, lido via `ref` quando preciso — menos re-render,
bom para forms grandes ou integração com libs (React Hook Form usa isso). Use controlado para
forms pequenos/interativos; não-controlado quando performance ou simplicidade pedirem.
</details>

**4. (Júnior) Como você impede o duplo envio de um formulário?**
<details><summary>Resposta-modelo</summary>
Mantendo um estado `loading`/`submitting`: ao iniciar o submit, `setLoading(true)` e
`disabled={loading}` no botão; no `finally`, `setLoading(false)`. Assim o botão fica inativo
enquanto a requisição corre. É o padrão do [Login.jsx](../../src/pages/Login.jsx#L242).
</details>

**5. (Pleno) Por que modelar um wizard com um estado `step` é melhor que vários booleanos?**
<details><summary>Resposta-modelo</summary>
Com um `step` (máquina de estados) só existe **um** estado válido por vez; a renderização é um
mapeamento direto e transições são explícitas (`setStep(2)`). Vários booleanos (`isStep1`,
`isStep2`…) permitem combinações inválidas (dois true), exigem sincronização manual e geram bugs.
O estado único é mais simples de raciocinar, testar e estender.
</details>

**6. (Pleno) Quando migrar de `useState` para React Hook Form + Zod, e o que muda?**
<details><summary>Resposta-modelo</summary>
Quando o formulário cresce (muitos campos, validação complexa/condicional, re-renders custando
performance). RHF usa inputs em grande parte não-controlados (via ref), reduzindo re-renders, e
integra validação por schema (Zod/Yup) reutilizável e tipada. Muda-se de "estado por campo +
validação manual" para "registrar campos + schema declarativo". Trade-off: +bundle e curva, em
troca de menos código e menos bugs em forms grandes. Para o login atual, não compensa.
</details>

**7. (Pleno) Validação de cliente x de servidor: por que ter as duas e qual é a autoridade?**
<details><summary>Resposta-modelo</summary>
Validação de cliente melhora UX (feedback imediato, menos requisições inválidas) mas é
**burlável** (o usuário controla o navegador). A de servidor é a **autoridade** de segurança e
integridade — sempre obrigatória. No projeto, há checagens de cliente (OTP 6 dígitos, senha ≥ 8,
`type=email`), mas as mensagens finais de erro vêm do backend e são tratadas no `catch`. Regra:
cliente para conveniência, servidor para confiança.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Wizard de cadastro em 3 etapas"**: um formulário multi-etapas avulso, com dados fake (sem
backend real — use `setTimeout` para simular a API).

1. Etapas via estado `step` (1→dados pessoais, 2→endereço, 3→revisão/sucesso).
2. Inputs **controlados** com validação por etapa (ex.: e-mail válido, CEP com 8 dígitos);
   botão "Avançar" desabilitado enquanto inválido.
3. Um campo de "código" com **4 inputs** que avançam o foco automaticamente (use `useRef`),
   inspirado no OTP do projeto.
4. Na última etapa, "enviar" simula uma API com `setTimeout`, mostra "Enviando..." e, no
   sucesso, exibe um resumo dos dados.

**Critério de sucesso**: não dá para avançar com etapa inválida; o foco dos 4 dígitos anda
sozinho ao digitar e volta no backspace; o botão final bloqueia durante o "envio" e mostra o
resumo ao terminar.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar formulários controlados, escrever a lógica de wizard, montar os
  handlers de OTP/foco e sugerir schemas de validação (Zod).
- **Onde atrapalha**: a IA às vezes esquece `preventDefault`, não desabilita o botão durante o
  envio (permitindo duplo submit), confia **só** na validação de cliente, e usa `onClick` no
  botão em vez de `<form onSubmit>` (perdendo o Enter/acessibilidade). Pode também sugerir RHF
  num form de 2 campos (overkill).
- **Decisão sua**: a **modelagem do fluxo** (quais etapas, o que valida onde, o que é cliente
  vs. servidor) e a escolha de **biblioteca** são suas. Defina o contrato e as regras; use a IA
  para preencher os handlers depois.
