# Módulo 12 — Feedback de UI

> **Objetivo**: dominar como a interface conversa com o usuário durante operações — estados de
> **carregando**, **erro**, **vazio** e **sucesso** — usando os componentes reutilizáveis do
> projeto (`LoadingSpinner`, `ErrorBanner`, `EmptyState`, `StatusBadge`). E o ponto fino:
> **traduzir erros** técnicos do backend em mensagens humanas, sem vazar detalhes.

**Arquivos cobertos:**
- [src/components/LoadingSpinner.jsx](../../src/components/LoadingSpinner.jsx)
- [src/components/ErrorBanner.jsx](../../src/components/ErrorBanner.jsx)
- [src/components/EmptyState.jsx](../../src/components/EmptyState.jsx)
- [src/components/StatusBadge.jsx](../../src/components/StatusBadge.jsx)
- [src/services/http.js](../../src/services/http.js#L57-L78) — `sanitizeErrorMessage`
- Consumidores: [Caronas.jsx](../../src/pages/Caronas.jsx#L260-L280), [Usuarios.jsx](../../src/pages/Usuarios.jsx#L240-L335), [Auditoria.jsx](../../src/pages/Auditoria.jsx#L298-L304)

---

## 1. Os quatro estados de toda tela que busca dados

Uma tela que consome API tem, no mínimo, **quatro** estados — e tratar todos é o que separa
uma UI amadora de uma profissional:

1. **Carregando** (loading) — a requisição está em curso.
2. **Erro** — a requisição falhou.
3. **Vazio** (empty) — sucesso, mas sem resultados.
4. **Conteúdo** — sucesso com dados.

O [Caronas.jsx](../../src/pages/Caronas.jsx) é o exemplo completo. No topo da renderização ele
trata loading e erro **antes** de tentar desenhar a lista
([L260-L280](../../src/pages/Caronas.jsx#L260-L280)):

```jsx
if (loading) return <div className={styles.container}><LoadingSpinner size={28} /></div>;
if (error)   return <div className={styles.container}><ErrorBanner error={error} title="..." onRetry={load} /></div>;
// ... e mais adiante, o estado vazio:
{rides.length === 0 && <EmptyState icon={IconCar} title="Nenhuma carona encontrada." />}
```

Esse padrão "**early return** para loading/erro" mantém o JSX principal limpo: quando o código
chega na renderização da lista, já se sabe que há dados.

---

## 2. `LoadingSpinner`: o estado de espera

O [LoadingSpinner](../../src/components/LoadingSpinner.jsx) é mínimo — um ícone que gira
(animação CSS na classe `.spin`) e um texto opcional:

```jsx
export function LoadingSpinner({ size = 28, text }) {
  return (
    <div className={styles.wrapper}>
      <IconLoader2 size={size} className={styles.spin} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
```

Usado de duas formas: tela cheia (`<LoadingSpinner size={28} />` em Caronas) ou com legenda
(`<LoadingSpinner size={28} text="Carregando logs..." />` em
[Auditoria.jsx](../../src/pages/Auditoria.jsx#L299)). Há ainda **micro-loadings** inline — por
exemplo, no detalhe da carona, um spinner pequeno só na seção de rota/passageiros enquanto o
`/resumo` chega ([Caronas.jsx](../../src/pages/Caronas.jsx#L454-L457)). Dar feedback **local**
(só na parte que carrega) é melhor UX que travar a tela inteira.

---

## 3. `ErrorBanner`: erro em dois formatos

O [ErrorBanner](../../src/components/ErrorBanner.jsx) é um componente **polimórfico** — muda de
forma conforme as props (revisão do Módulo 03):

```jsx
export function ErrorBanner({ error, title, onRetry }) {
  if (title || onRetry) {            // modo "card": erro que ocupa a tela toda
    return <div className={styles.card}>... <button onClick={onRetry}>Tentar novamente</button> ...</div>;
  }
  return <div className={styles.inline}><IconAlertCircle/> <span>{error}</span></div>;  // modo inline
}
```

- **Modo card** (com `title`/`onRetry`): para erros que **substituem** o conteúdo — vem com
  ícone grande e botão "Tentar novamente". O `onRetry` recebe a própria função de carga
  (`load`), permitindo retentar com um clique sem recarregar a página
  ([Caronas.jsx](../../src/pages/Caronas.jsx#L273-L277)).
- **Modo inline** (só `error`): uma faixa discreta para erros **dentro** de uma tela já
  carregada ([Usuarios.jsx](../../src/pages/Usuarios.jsx#L244)).

Oferecer **retry** é um detalhe de qualidade: falhas de rede são transitórias; forçar o usuário
a recarregar tudo é hostil.

---

## 4. `EmptyState`: o vazio que orienta

Lista vazia não é erro — é um estado legítimo que merece comunicação clara. O
[EmptyState](../../src/components/EmptyState.jsx) recebe ícone, título, descrição e uma **ação**
opcional (CTA):

```jsx
<EmptyState icon={IconCar} title="Nenhuma carona encontrada." />
```

A prop `action` ({ label, onClick }) permite oferecer um próximo passo ("Cadastrar primeiro
item"), transformando um beco sem saída em um convite. Um bom empty state reduz a sensação de
"quebrou" e guia o usuário.

---

## 5. `StatusBadge`: feedback de estado por cor

O [StatusBadge](../../src/components/StatusBadge.jsx) (detalhado nos Módulos 03 e 08) é feedback
**visual** de estado: traduz um rótulo (`'Ativo'`, `'Cancelada'`) numa cor semântica
(verde/vermelho/amarelo/azul/roxo). Cor comunica antes da leitura — o olho identifica "vermelho =
problema" instantaneamente. O fallback para `'Pendente'` garante que um status desconhecido
ainda renderize algo, sem quebrar.

---

## 6. Tradução de erro: o ponto fino

O melhor feedback de erro é **honesto, mas não cru**. O `http.js` tem
[`sanitizeErrorMessage`](../../src/services/http.js#L67-L78) que **intercepta** mensagens antes
de chegarem à UI:

```js
function sanitizeErrorMessage(raw, status) {
  if (status >= 500) { console.error("[http] Erro de servidor suprimido:", raw); return "Erro interno do servidor. Tente novamente mais tarde."; }
  if (SCHEMA_LEAK_RE.test(raw)) { console.error("[http] Detalhe técnico suprimido:", raw); return "Ocorreu um erro inesperado. Tente novamente ou contate o suporte."; }
  return raw;
}
```

Regras (revisão do Módulo 05, agora sob a ótica de UX):
- **5xx** → sempre mensagem genérica (o usuário não pode fazer nada sobre um erro de servidor).
- **Vazamento de schema** (nomes de coluna `usu_`/`car_`, SQL, códigos MySQL) → mensagem
  genérica, porque expor isso é falha de segurança **e** assusta o usuário.
- **Caso contrário** → mostra a mensagem do backend (que costuma ser acionável: "E-mail já
  cadastrado").
- **Sempre** loga o detalhe real no `console` para o desenvolvedor diagnosticar.

Do lado da tela, a UI ainda pode **especializar** por status. Em
[Auditoria.jsx](../../src/pages/Auditoria.jsx#L160-L166), um 403 vira "restrito a
desenvolvedores"; outros, "Não foi possível carregar os logs". E em
[Usuarios.jsx](../../src/pages/Usuarios.jsx#L211) lê-se `err?.body?.error` para mostrar a
mensagem precisa de uma falha de ação.

---

## 7. Confirmação de ações destrutivas

Para ações irreversíveis (desativar usuário), o projeto usa `window.confirm` antes de chamar a
API ([Usuarios.jsx](../../src/pages/Usuarios.jsx#L198-L214)):

```jsx
if (!window.confirm(`Tem certeza que deseja ${acao} ${nome}?`)) return;
```

É feedback **preventivo** (evita erro do usuário). `window.confirm`/`window.alert` são simples e
nativos, mas **bloqueiam** a thread e não combinam com o design system (visual do SO). Em um
produto polido, viram **modais** customizados — assunto da seção de alternativas.

> Observação: o projeto **não** usa uma biblioteca de **toast** (notificação flutuante temporária
> de sucesso/erro). O feedback hoje é via banners inline, estados de tela e `alert`/`confirm`. Os
> tokens de toast existem no [global.css](../../src/global.css#L225-L231), prontos para quando um
> componente de toast for adicionado.

---

## 8. Efeito em performance e acessibilidade

- **Feedback local > global**: spinners por seção (em vez de tela cheia) mantêm contexto e
  evitam *layout shift* (que prejudica o **CLS**, um Core Web Vital — Módulo 13).
- **`window.alert/confirm` bloqueiam** o event loop — evite em fluxos de alta frequência.
- **Acessibilidade**: mensagens de erro/loading idealmente usam `role="alert"`/`aria-live` para
  leitores de tela anunciarem a mudança. O projeto usa `aria-label` em botões; um próximo passo
  de a11y (Módulo 16) seria anunciar estados de carregamento/erro.
- **Evite "flash"**: o `load(silent)` em pollings (Módulos 10-11) impede piscar o spinner a cada
  ciclo — um detalhe de UX que também evita re-render visual desnecessário.

---

## Âncoras de leitura

1. Em [Caronas.jsx](../../src/pages/Caronas.jsx), localize os **early returns** de loading e erro
   e o `EmptyState`. Em que ordem aparecem e por quê?
2. Em [ErrorBanner.jsx](../../src/components/ErrorBanner.jsx), descubra o que faz o componente
   alternar entre o modo "card" e o modo "inline".
3. Em [Caronas.jsx](../../src/pages/Caronas.jsx), ache o `onRetry` passado ao `ErrorBanner` e diga
   o que ele executa.
4. Em [http.js](../../src/services/http.js), explique as três decisões de `sanitizeErrorMessage`
   (5xx, schema leak, resto).
5. Em [Usuarios.jsx](../../src/pages/Usuarios.jsx), encontre a confirmação de ação destrutiva e a
   leitura de `err?.body?.error`.

---

## Para aprofundar

**Documentação oficial / referência:**
- MDN — *ARIA: alert role*: https://developer.mozilla.org/pt-BR/docs/Web/Accessibility/ARIA/Roles/alert_role
- MDN — *aria-live*: https://developer.mozilla.org/pt-BR/docs/Web/Accessibility/ARIA/Attributes/aria-live
- MDN — *Window.confirm*: https://developer.mozilla.org/pt-BR/docs/Web/API/Window/confirm
- React — *Conditional Rendering*: https://react.dev/learn/conditional-rendering
- Nielsen Norman Group — *Error message guidelines*: https://www.nngroup.com/articles/error-message-guidelines/

**Vídeos (PT-BR) — confira a versão:**
- Busque por **"loading error empty state React pt-br"**, **"react-hot-toast / sonner português"**
  (libs de toast), **"acessibilidade aria-live pt-br"**.
- Canais: *Rocketseat*, *Dev Soutinho* (a11y), *Matheus Battisti – Hora de Codar*.

> **Ressalva**: a base aqui é HTML/ARIA + padrões de UX, estáveis e independentes de versão. Para
> libs de toast, confira compatibilidade com React 19. A fonte da verdade são os componentes
> deste projeto e a MDN.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) Por que mostrar um indicador de "carregando"?**
<details><summary>Resposta-modelo</summary>
Para comunicar que o sistema está trabalhando, evitando que o usuário ache que travou ou clique
repetidamente. Reduz a incerteza e melhora a percepção de desempenho. No projeto, é o
`LoadingSpinner`.
</details>

**2. (Estudante) O que é um "estado vazio" (empty state) e por que tratá-lo?**
<details><summary>Resposta-modelo</summary>
É quando uma operação deu certo mas não há dados para mostrar (lista vazia). Tratá-lo com uma
mensagem clara (e às vezes uma ação) evita que o usuário pense que houve erro e orienta o próximo
passo. No projeto, é o `EmptyState`.
</details>

**3. (Júnior) Quais estados uma tela que busca dados deve tratar, e como o projeto os organiza?**
<details><summary>Resposta-modelo</summary>
Loading, erro, vazio e conteúdo. O projeto usa **early returns** para loading e erro no topo da
renderização (ex.: [Caronas.jsx](../../src/pages/Caronas.jsx)), checa lista vazia com `EmptyState`,
e só então renderiza o conteúdo. Isso mantém o JSX principal assumindo "dados presentes".
</details>

**4. (Júnior) Por que oferecer um botão "Tentar novamente" em erros?**
<details><summary>Resposta-modelo</summary>
Porque muitas falhas (rede, timeout, 5xx temporário) são transitórias. Um retry de um clique
(reexecutando a função de carga, como o `onRetry={load}` em Caronas) resolve sem o usuário
recarregar a página inteira nem perder contexto — melhor UX e menos frustração.
</details>

**5. (Pleno) Por que sanitizar mensagens de erro antes de exibi-las? Dê o trade-off.**
<details><summary>Resposta-modelo</summary>
Para não vazar detalhes internos (schema do banco, SQL, stack) — que são risco de segurança e
ruído para o usuário — e para dar mensagens acionáveis. Trade-off: o usuário perde o detalhe
técnico, então é essencial logar o erro real no console/observabilidade para o dev diagnosticar.
O projeto faz isso em `sanitizeErrorMessage`: genérico na tela, completo no `console`.
</details>

**6. (Pleno) `window.confirm` é adequado para confirmar ações destrutivas? O que você usaria em
produção?**
<details><summary>Resposta-modelo</summary>
Funciona e é seguro (bloqueia até decidir), mas tem limitações: visual do SO (fora do design
system), bloqueia a thread, não é estilizável nem totalmente acessível/testável. Em produção eu
usaria um **modal** customizado, acessível (foco preso, `role="dialog"`, ESC fecha), consistente
com os tokens, e idealmente com confirmação por digitação para ações muito perigosas. Mantém UX e
testabilidade.
</details>

**7. (Pleno) Como você tornaria os feedbacks de loading/erro acessíveis a leitores de tela?**
<details><summary>Resposta-modelo</summary>
Usando regiões **live**: envolver mensagens de erro com `role="alert"` (ou `aria-live="assertive"`)
para serem anunciadas imediatamente, e estados de carregamento com `aria-live="polite"` +
`aria-busy`. Spinners puramente visuais devem ter texto alternativo ("Carregando..."). Garantir
foco gerenciado ao abrir modais. Hoje o projeto usa `aria-label` em botões; anunciar estados
dinâmicos seria a evolução natural (Módulo 16).
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Tela de 4 estados"**: uma tela avulsa que busca uma lista de uma API pública (ou fake com
`setTimeout`) e trata **os quatro** estados.

1. `LoadingSpinner`, `ErrorBanner` (com `onRetry`) e `EmptyState` (com `action`) próprios.
2. Um botão "simular erro" e "simular vazio" para forçar cada estado sem depender da sorte da
   rede.
3. Garanta os early returns: loading → erro → vazio → conteúdo.
4. **Bônus a11y**: dê `role="alert"` ao erro e `aria-live="polite"` ao loading; teste com o leitor
   de tela do SO.

**Critério de sucesso**: cada estado renderiza o componente certo; o retry refaz a busca; o
vazio mostra a ação; (bônus) o leitor de tela anuncia erro e carregamento.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar os componentes de feedback, padronizar os early returns e sugerir
  mensagens de erro humanizadas e atributos ARIA.
- **Onde atrapalha**: a IA costuma esquecer o **estado vazio** e o **retry**, exibir o erro cru do
  backend direto na tela (vazando detalhe), e ignorar acessibilidade. Também tende a usar
  `alert/confirm` onde um modal seria melhor.
- **Decisão sua**: o **tom das mensagens** (clareza, sem culpar o usuário, sem jargão) e **o que
  esconder vs. mostrar** são decisões de produto/segurança. Defina o padrão de feedback do app;
  use a IA para aplicá-lo de forma consistente.
