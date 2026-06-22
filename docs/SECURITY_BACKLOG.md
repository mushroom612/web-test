# Backlog de Segurança — TucTuc

> **Como usar:** Cada item tem status, prioridade, fluxo completo e prós/contras.  
> Implemente na ordem de prioridade. Marque `[x]` quando concluído.

---

## Status geral

| # | Item | Prioridade | Status | Libs novas |
|---|---|---|---|---|
| 1 | [Tokens em memória + cookie httpOnly](#1-tokens-em-memória--cookie-httponly) | 🔴 Alta | `[ ]` Pendente | Nenhuma |
| 2 | [HTTPS em produção (PaaS)](#2-https-em-produção-paas) | 🔴 Alta | `[ ]` Pendente | Nenhuma |
| 3 | [Rate limiting no /refresh](#3-rate-limiting-no-refresh) | 🟡 Média | `[ ]` Pendente | Nenhuma |
| 4 | [Força de senha (regex)](#4-força-de-senha-regex-sem-lib) | 🟡 Média | `[ ]` Pendente | Nenhuma |
| 5 | [Centralizar validação](#5-centralizar-validação) | 🟢 Baixa | `[ ]` Pendente | Opcional |

---

---

## 1. Tokens em memória + cookie httpOnly

### O que é

Hoje o `refresh_token` fica no `localStorage`. Qualquer script JavaScript que execute na página consegue ler `localStorage.getItem('refresh_token')` — isso inclui ataques XSS, extensões de browser maliciosas e dependências npm comprometidas.

A mudança move o refresh token para um **cookie `httpOnly`**: um cookie que o browser envia automaticamente, mas que o JavaScript da página **jamais consegue ler**. O access token sai do localStorage e passa a existir **só na memória** (variável do `AuthContext`).

### Prós

- Elimina o vetor de roubo de token via XSS — o ataque mais comum contra SPAs
- Zero dependência nova — usa `res.cookie()` do Express e estado React
- O fluxo de refresh continua automático; o usuário não percebe nenhuma mudança
- Se a página recarregar, o access token some da memória, mas o cookie ainda existe e o refresh reemite o access token silenciosamente em milissegundos

### Contras

- Requer ajuste nos dois lados (backend emite cookie, frontend para de ler o refresh do localStorage)
- Em desenvolvimento local com frontend e backend em portas diferentes (ex: `5173` e `3000`), cookies com `SameSite=Strict` **não funcionam** por serem origens diferentes. Solução: usar `SameSite=None; Secure` em dev, ou usar um proxy no Vite para roteá-los como mesma origem
- A função de "manter logado" (persistir sessão entre abas/reinicializações) deixa de ser responsabilidade do localStorage e passa a ser do cookie — que é transparente, mas exige que o backend sempre envie o cookie com `Max-Age` correto

### Fluxo de implementação

```
ESTADO ATUAL:
  Login → backend retorna { access_token, refresh_token } no JSON
  Frontend → guarda ambos no localStorage

ESTADO ALVO:
  Login → backend retorna { access_token } no JSON
           + Set-Cookie: refresh_token=xxx; httpOnly; Secure; SameSite=Strict; Path=/api/usuarios/refresh
  Frontend → guarda access_token só no estado React (não no localStorage)
           → browser gerencia o cookie automaticamente

REFRESH AUTOMÁTICO:
  1. Access token expira (erro 401)
  2. Frontend chama GET /api/usuarios/refresh (sem corpo, sem header de token)
  3. Browser envia o cookie de refresh automaticamente
  4. Backend lê req.cookies.refresh_token, valida o hash, rotaciona
  5. Backend retorna { access_token: "novo" } + novo Set-Cookie com refresh rotacionado
  6. Frontend atualiza o access token na memória e retenta a requisição original

LOGOUT:
  1. Frontend chama POST /api/usuarios/logout
  2. Backend invalida o hash no banco
  3. Backend responde com Set-Cookie: refresh_token=; Max-Age=0  (apaga o cookie)
  4. Frontend limpa o access token do estado React
```

### Arquivos a alterar

**Backend:**
- `UsuarioController.js` → método `login()`: trocar `res.json({ refresh_token })` por `res.cookie('refresh_token', token, opts)`
- `UsuarioController.js` → método `refreshToken()`: trocar leitura de `req.body.refresh_token` por `req.cookies.refresh_token`
- `UsuarioController.js` → método `logout()`: adicionar `res.clearCookie('refresh_token')`
- `server.js`: adicionar `app.use(require('cookie-parser')())` — **única dependência nova**, já incluída indiretamente pelo Express mas precisa ser instalada explicitamente

**Frontend:**
- `services/http.js` → remover envio do refresh token no corpo da chamada `/refresh`; o browser envia o cookie automaticamente
- `context/AuthContext.jsx` → access token deixa de ir ao localStorage; vai para `useRef` ou `useState`
- `services/tokens.js` (se existir arquivo separado) → remover operações de refresh token

### Dependência

| Pacote | Uso | Já instalado? |
|---|---|---|
| `cookie-parser` | Middleware para ler `req.cookies` no Express | Provavelmente não — verificar |

---

---

## 2. HTTPS em produção (PaaS)

### O que é

Em plataformas como Railway, Render e Fly.io, o HTTPS é fornecido **automaticamente** pela plataforma — você não precisa instalar certificado nem configurar Nginx. O que precisa ser feito é garantir que a aplicação **exija** HTTPS (não aceite HTTP) e que os headers de segurança estejam ativos.

### Prós

- Zero configuração de infraestrutura — a plataforma cuida do certificado SSL/TLS e renovação automática
- Basta fazer o deploy; HTTPS ativo no primeiro acesso
- O Helmet com HSTS já está configurado no projeto — vai funcionar automaticamente em produção
- Qualquer dado trafegado (tokens, dados pessoais, coordenadas GPS) fica criptografado — crítico para redes de wi-fi universitário

### Contras

- Depende do domínio correto estar configurado na variável `ALLOWED_ORIGINS` antes do deploy
- Se a variável `NODE_ENV` não for `production` na plataforma, o HSTS do Helmet não ativa (ele tem `process.env.NODE_ENV !== 'development'` como guard)
- Algumas plataformas usam um proxy reverso interno e encaminham as requisições como HTTP para o Node.js — é preciso confiar no header `X-Forwarded-Proto` para detectar que a requisição original era HTTPS

### Fluxo de implementação

```
1. DEPLOY INICIAL
   └─> Criar conta na plataforma escolhida (Railway / Render / Fly.io)
   └─> Conectar ao repositório GitHub
   └─> Configurar variáveis de ambiente (ver lista abaixo)
   └─> A plataforma gera uma URL com HTTPS automático (ex: api-tuctuc.railway.app)

2. CONFIGURAR VARIÁVEIS DE AMBIENTE NA PLATAFORMA
   NODE_ENV=production
   JWT_SECRET=<string aleatória longa>
   JWT_EXPIRES_IN=15m              ← reduzir de 24h para 15min após implementar item 1
   REFRESH_SECRET=<string aleatória longa>
   OTP_SECRET=<string aleatória longa>
   DB_HOST=<host do banco em produção>
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=...
   ALLOWED_ORIGINS=https://painel.tuctuc.com.br  ← URL real do frontend
   EMAIL_USER=...
   EMAIL_PASS=...

3. REDIRECIONAR HTTP → HTTPS (adicionar ao server.js)
   Antes de qualquer rota, adicionar middleware:
   
   app.use((req, res, next) => {
     const proto = req.headers['x-forwarded-proto'];
     if (proto && proto !== 'https' && process.env.NODE_ENV === 'production') {
       return res.redirect(301, `https://${req.hostname}${req.url}`);
     }
     next();
   });

4. VERIFICAR QUE O HSTS ESTÁ ATIVO
   Após deploy, inspecionar os headers da resposta:
   Esperado: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   O Helmet já configura isso — só precisa que NODE_ENV=production
```

### Dependência

Nenhuma. A plataforma PaaS gerencia o certificado. O `cookie-parser` (item 1) também é necessário aqui para que os cookies de refresh funcionem em produção.

---

---

## 3. Rate limiting no /refresh

### O que é

O endpoint `/api/usuarios/refresh` não tem limite de chamadas dedicado. Um atacante com um refresh token válido poderia chamá-lo indefinidamente sem throttling. Além disso, em cenários de ataque de enumeração, múltiplos refreshes paralelos de IPs variados ficam livres.

O projeto já usa `express-rate-limit` — é só adicionar um limiter para essa rota.

### Prós

- Implementação de 3 linhas — menor esforço possível
- Usa a mesma biblioteca já instalada (`express-rate-limit`)
- Sem impacto em usuários normais (refresh legítimo ocorre no máximo 1x a cada 15 minutos por sessão)

### Contras

- Rate limiting por IP pode afetar usuários atrás de um NAT compartilhado (ex: toda a rede wi-fi da faculdade com o mesmo IP externo) — mitigado escolhendo um limite generoso (ex: 30/15min)
- Não substitui a rotação de refresh token já implementada — é uma camada adicional

### Fluxo de implementação

```
Em server.js, junto dos outros limiters existentes, adicionar:

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // janela de 15 minutos
  max: 30,                      // 30 refreshes por IP por janela
  message: { error: 'Muitas tentativas de renovação de sessão. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/usuarios/refresh', refreshLimiter);
```

Adicionar junto dos outros `app.use('/api/usuarios/...')` já existentes no `server.js`.

### Dependência

Nenhuma. `express-rate-limit` já está instalado.

---

---

## 4. Força de senha (regex, sem lib)

### O que é

Hoje o backend só verifica `usu_senha.length >= 8`. Senhas como `12345678`, `aaaaaaaa` ou `senha123` são aceitas sem restrição. A validação de complexidade exige ao menos um caractere de cada categoria para dificultar ataques de dicionário e force-bruta.

Optou-se por **regex customizada** em vez de biblioteca (ex: `zxcvbn`) para manter zero dependências novas.

### Regra definida

Senha válida deve ter **no mínimo 8 caracteres** e conter ao menos:
- 1 letra maiúscula (`A-Z`)
- 1 letra minúscula (`a-z`)
- 1 dígito (`0-9`)
- 1 caractere especial (`!@#$%^&*()-_+=` etc.)

### Prós

- Zero dependência nova
- Regra explícita e auditável — fácil de ajustar
- Aplicável tanto no backend (validação real) quanto no frontend (feedback imediato ao usuário)

### Contras

- Não detecta senhas óbvias que cumprem as regras: `Password1!` ou `Admin123@` passam na regex mas são fracas por serem previsíveis — isso exigiria `zxcvbn` ou lista de senhas proibidas
- Para um TCC, a regex é adequada; para produção com dados sensíveis, avaliar `zxcvbn`

### Fluxo de implementação

```
BACKEND — UsuarioController.js

Trocar a validação atual:
  if (usu_senha.length < 8) { ... }

Por:
  const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{8,128}$/;
  if (!SENHA_REGEX.test(usu_senha)) {
    return res.status(400).json({
      error: 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.'
    });
  }

Aplicar nos métodos: cadastro(), resetarSenha(), atualizarSenha()


FRONTEND — Login.jsx (fluxo de nova senha)

Adicionar a mesma regex para feedback visual antes de enviar:
  const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{8,128}$/;
  if (!SENHA_REGEX.test(novaSenha)) {
    setForgotError('A senha deve ter maiúscula, minúscula, número e caractere especial.');
    return;
  }

Opcional: adicionar indicador visual de força (barra de progresso) baseado em quantos
critérios a senha já cumpre — sem lib, usando apenas useState e checagens simples.
```

### Dependência

Nenhuma.

---

---

## 5. Centralizar validação

### O que é

Hoje as validações (regex de email, tamanho mínimo, campos obrigatórios) estão espalhadas dentro de cada controller com `if/else` manuais. Isso cria risco de inconsistência: um controller pode validar o email diferente de outro, ou esquecer um campo.

Centralizar significa ter um único lugar onde as regras de validação de cada entidade vivem.

### Duas opções disponíveis

---

#### Opção A — `validators.js` utilitário (sem lib nova)

Extrair todas as regras de validação para um arquivo `src/utils/validators.js` com funções puras e reutilizáveis.

**Prós:**
- Zero dependência nova
- Funções testáveis de forma isolada
- Cada controller importa só o que precisa

**Contras:**
- Você escreve e mantém cada validador manualmente
- Sem sanitização automática (trim, lowercase) — precisa chamar explicitamente
- Mais código para implementar do que a Opção B

**Estrutura:**
```javascript
// src/utils/validators.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,128}$/;

function validarEmail(email) {
  if (!email || typeof email !== 'string') return 'Email é obrigatório.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Formato de email inválido.';
  return null; // null = sem erro
}

function validarSenha(senha) {
  if (!senha) return 'Senha é obrigatória.';
  if (!SENHA_REGEX.test(senha)) return 'A senha deve ter maiúscula, minúscula, número e caractere especial.';
  return null;
}

function validarCampoTexto(valor, nomeCampo, { min = 1, max = 255 } = {}) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) return `${nomeCampo} é obrigatório.`;
  if (valor.trim().length < min) return `${nomeCampo} deve ter ao menos ${min} caracteres.`;
  if (valor.trim().length > max) return `${nomeCampo} deve ter no máximo ${max} caracteres.`;
  return null;
}

module.exports = { validarEmail, validarSenha, validarCampoTexto };

// Uso no controller:
const { validarEmail, validarSenha } = require('../utils/validators');
const erroEmail = validarEmail(req.body.usu_email);
if (erroEmail) return res.status(400).json({ error: erroEmail });
```

---

#### Opção B — `express-validator` (1 lib nova)

Adicionar a biblioteca padrão da indústria para validação em Express. Permite declarar as regras diretamente na definição da rota, antes do controller ser chamado.

**Prós:**
- ~80 validadores prontos (`isEmail`, `isInt`, `isISO8601`, `isUUID`, etc.)
- Sanitização automática: `.trim()`, `.normalizeEmail()`, `.escape()`
- 1 middleware de erro centralizado para todas as rotas
- Zero regex manual para casos comuns

**Contras:**
- 1 dependência nova (146kB instalado, zero CVEs, 1.3M downloads/semana)
- Refatoração mais extensa: cada rota precisa ser atualizada para declarar seus validators

**Estrutura:**
```javascript
// src/middlewares/validate.js — escrito uma vez
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validate };

// Uso na rota:
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');

router.post('/login',
  body('usu_email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('usu_senha').isLength({ min: 8, max: 128 }).trim().withMessage('Senha inválida'),
  validate,
  UsuarioController.login
);
```

---

#### Qual escolher?

| Critério | Opção A (manual) | Opção B (express-validator) |
|---|---|---|
| Libs novas | 0 | 1 |
| Código a escrever | Mais | Menos |
| Sanitização automática | Manual | Automática |
| Casos complexos (UUID, ISO date, etc.) | Regex própria | Método pronto |
| Risco de inconsistência | Médio | Baixo |

**Recomendação:** Se a preferência é zero libs novas, Opção A resolve o problema de forma adequada para o escopo do TCC. Se em algum momento entrar TypeScript no projeto, migrar para `zod` (que unifica validação de API e tipagem) é o próximo passo natural.

### Dependência

- Opção A: Nenhuma
- Opção B: `express-validator` — `npm install express-validator`

---

---

## Notas de implementação

### Ordem recomendada

```
Semana 1:  Item 3 (rate limiting /refresh) — 15 min, zero risco
           Item 4 (força de senha)          — 1h, backend + frontend

Semana 2:  Item 1 (cookie httpOnly)         — maior esforço, dois lados

Semana 3:  Item 2 (HTTPS/PaaS)             — deploy + variáveis de ambiente

Quando tiver tempo:
           Item 5 (centralizar validação)   — refatoração de qualidade
```

### Itens descartados (decisão registrada)

| Item | Motivo da exclusão |
|---|---|
| CSP no frontend (Nginx/Vite) | Fora do escopo atual; relevante apenas após deploy com Nginx próprio |
| CSRF no /refresh | Mitigado pelo `SameSite=Strict` do cookie httpOnly (item 1); proteção dupla seria overkill para o TCC |
