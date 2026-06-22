# Módulo 02 — Design system e estilos

> **Objetivo**: entender como o projeto estiliza a interface **sem** Tailwind nem
> styled-components: usando **CSS Modules** (estilo com escopo por componente) e um
> **design system** baseado em **CSS variables** (os "tokens") declarados em um único lugar.
> Ao fim, você saberá ler um `.module.css`, usar um token e explicar por que cores/espaços
> não devem ser "chumbados" (hardcoded).

**Arquivos cobertos:**
- [src/global.css](../../src/global.css) — reset + todos os tokens
- [src/pages/Painel.module.css](../../src/pages/Painel.module.css) — exemplo de CSS Module
- [src/pages/Usuarios.module.css](../../src/pages/Usuarios.module.css) — outro exemplo
- [src/pages/Painel.jsx](../../src/pages/Painel.jsx) — como o JSX consome `styles`
- [index.html](../../index.html#L9-L12) — carregamento das fontes

---

## 1. O problema que CSS Modules resolve

CSS comum é **global**: se dois arquivos definem `.card`, eles colidem. Em um app com
dezenas de telas, isso vira pesadelo. **CSS Modules** resolve dando **escopo local** a cada
arquivo: a classe `.metricCard` de `Painel.module.css` é renomeada no build para algo
único como `Painel_metricCard_a1b2c`, impossível de colidir com a `.card` de outra tela.

A convenção é o sufixo **`.module.css`**. O Vite reconhece o sufixo e ativa o
comportamento. Você importa o arquivo como um **objeto JavaScript**:

```jsx
// Painel.jsx
import styles from './Painel.module.css';
// ...
<div className={styles.metricCard}> ... </div>
```

`styles.metricCard` é uma **string** com o nome de classe já "embaralhado". Por isso você
nunca escreve `className="metricCard"` (texto cru) num CSS Module — escreve
`className={styles.metricCard}`.

### Classes dinâmicas e combinadas

Quando uma classe depende de condição, o projeto usa *template strings*. Veja em
[Topbar.jsx](../../src/components/Topbar.jsx) o padrão (combinar duas classes):

```jsx
className={`${styles.notifDot} ${notifCount === 0 ? styles.notifDotRead : ""}`}
```

E em [Auditoria.jsx](../../src/pages/Auditoria.jsx#L339) o padrão de classe **calculada por
nome**:

```jsx
className={`${styles.actionBadge} ${styles[`badge_${getActionVariant(log.acao)}`]}`}
```

Aqui `styles['badge_danger']`, `styles['badge_success']` etc. são escolhidos em tempo de
execução. É legítimo, mas exige que **todas** as variantes existam no `.module.css` (senão
sai `undefined` e a classe some).

---

## 2. O design system: tokens em `global.css`

O coração visual do app é o [global.css](../../src/global.css). Ele é carregado **uma vez**
no [App.jsx](../../src/App.jsx#L16) e define, dentro de `:root { ... }`, dezenas de **CSS
custom properties** (variáveis CSS) — os **tokens de design**.

Há duas camadas de tokens, e essa separação é o ponto mais importante do módulo:

**Camada 1 — primitivos** (a paleta crua), ex.:
```css
--color-green-700: #4d9d24;
--color-neutral-0:  #ffffff;
--spacing-4: 16px;
--font-size-2xl: 24px;
--border-radius-2xl: 24px;
```

**Camada 2 — semânticos** (apontam para primitivos e dão *significado*), ex.:
```css
--surface-primary: var(--color-neutral-0);   /* fundo de cartões */
--text-primary:    var(--color-neutral-900); /* cor de texto padrão */
--btn-primary-bg:  var(--color-green-700);   /* fundo do botão principal */
--card-radius-desktop: var(--border-radius-2xl);
```

Os componentes consomem **os semânticos**, não os primitivos. Veja
[Painel.module.css](../../src/pages/Painel.module.css#L52-L57):

```css
.metricCard {
  background-color: var(--surface-primary);
  border: 1px solid var(--color-neutral-100);
  border-radius: var(--card-radius-desktop);
  padding: var(--spacing-6);
}
```

### Por que duas camadas? (a decisão do projeto)

Se amanhã o verde da marca mudar, você altera **um** primitivo (`--color-green-700`) e o app
inteiro acompanha. Se você quiser trocar "o fundo dos cartões" sem mexer na paleta, altera o
semântico (`--surface-primary`). Essa indireção é o que torna um design system **escalável**:
a mudança é num ponto, não em 200 arquivos.

> Neste projeto há uma **restrição explícita**: a paleta de verde do
> [global.css](../../src/global.css#L50-L60) **não deve ser alterada**. Ou seja, mexa em
> semânticos e em uso, nunca nos hex da escala de verde.

### Escala de tokens (decore as âncoras)

| Família | Valores | Onde aparece |
| --- | --- | --- |
| `--spacing-*` | 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px… | paddings, gaps, margins |
| `--font-size-*` | xs=12, sm=14, base=16, lg=18, xl=20, 2xl=24, 3xl=30, 4xl=36 | textos |
| `--border-radius-*` | sm=4, md=8, lg=12, xl=16, 2xl=24, full=9999 | cantos arredondados |
| `--color-green-*` | 50…900 | identidade da marca (**não mudar os hex**) |
| `--color-neutral-*` | 0…950 | textos, bordas, fundos |

`--border-radius-full: 9999px` é o truque para fazer **pílulas** e círculos (avatares,
badges). Você o vê nos botões em formato de pílula e nos avatares circulares.

---

## 3. Fontes e reset global

No topo do [global.css](../../src/global.css#L5-L43) há um **reset**:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```

`box-sizing: border-box` faz `width`/`height` incluírem padding e borda — o cálculo de
layout fica previsível. As fontes vêm do Google Fonts via `<link>` no
[index.html](../../index.html#L9-L12): **Roboto** para corpo e **Space Grotesk** para
títulos (`--font-family-heading`), aplicada em `h1..h6`.

---

## 4. Responsividade

O projeto faz responsividade com **media queries** dentro de cada `.module.css`. Veja o fim
do [Painel.module.css](../../src/pages/Painel.module.css#L203-L235):

```css
@media (max-width: 1024px) {
  .userFeedback { flex-direction: column; }
  ...
}
@media (max-width: 600px) { .metricsGrid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .metricsGrid { grid-template-columns: 1fr; } }
```

A estratégia é **desktop-first** (estilo base é para telas largas; as media queries
*reduzem* conforme a tela encolhe). O layout usa **Flexbox** e **CSS Grid** — por exemplo,
`.metricsGrid` é um grid de 2 colunas que vira 1 coluna no celular.

---

## 5. Alternativas de estilização (e o trade-off)

| Abordagem | Prós | Contras | Cabe aqui? |
| --- | --- | --- | --- |
| **CSS Modules** (escolhido) | Escopo automático, CSS puro, zero runtime, ótimo com Vite | Classes dinâmicas verbosas; sem "utilitários" prontos | Sim — é o que o projeto usa |
| **Tailwind CSS** | Velocidade, consistência via utilitários, purge enxuto | Curva inicial, HTML "poluído" de classes, refactor de design system diferente | Possível, mas trocaria toda a base de tokens CSS |
| **styled-components / Emotion** (CSS-in-JS) | Estilo colado ao componente, props dinâmicas | Custo de runtime, bundle maior, SSR mais chato | Evitável num painel simples |
| **CSS global puro** | Simplicidade | Colisões de nome inevitáveis em escala | Não |

A escolha por **CSS Modules + tokens** é coerente com um projeto sem framework de UI: é CSS
de verdade (você aprende a plataforma), tem escopo seguro e **nenhum custo de runtime** —
tudo é resolvido no build.

---

## 6. Como isso conversa com a API e o banco

**Não conversa.** Estilo é 100% client-side. O único cruzamento indireto é semântico: a UI
**traduz** estados do banco em **cores semânticas**. Exemplo em
[Auditoria.jsx](../../src/pages/Auditoria.jsx#L112-L118): a função `getActionVariant()`
mapeia o texto da ação para `danger`/`warning`/`success`/`info`, e o CSS pinta com os tokens
de status (`--status-success-bg`, etc.). Ou seja: o dado vem da API, mas a **decisão de cor**
é regra de UI baseada em tokens.

---

## 7. Efeito em performance

- **Sem runtime**: CSS Modules viram arquivos `.css` estáticos no build — não há custo de JS
  para aplicar estilo (ao contrário de CSS-in-JS).
- **CSS variables são baratas**: o navegador resolve `var(--x)` nativamente; trocar um token
  no `:root` re-pinta sem re-render do React.
- **Tamanho do CSS**: cada `.module.css` entra no bundle de CSS. Hoje todos são carregados;
  como o CSS do projeto é pequeno, o impacto é baixo. Em apps grandes, o Vite consegue
  *code-split* de CSS por rota junto com o JS.
- **Evite estilos inline dinâmicos** em listas grandes (ex.: `style={{...}}` recalculado a
  cada render) — preferir classes. O projeto usa inline só pontualmente (ex.: a imagem do
  avatar em [Usuarios.jsx](../../src/pages/Usuarios.jsx#L62-L64)).

---

## Âncoras de leitura

1. Em [global.css](../../src/global.css), encontre o token semântico usado como **fundo dos
   cartões** e diga para qual primitivo ele aponta.
2. Em [Painel.module.css](../../src/pages/Painel.module.css), liste **5** tokens
   diferentes em uso e o que cada um controla.
3. Em [Auditoria.jsx](../../src/pages/Auditoria.jsx), ache a linha que monta o nome da classe
   de badge **dinamicamente** e explique o risco se uma variante não existir no CSS.
4. Em [global.css](../../src/global.css), descubra qual token cria o **formato de pílula**
   (cantos totalmente arredondados) e procure onde ele é usado num `.module.css`.
5. Compare `.avatar` em [Usuarios.module.css](../../src/pages/Usuarios.module.css#L184-L196):
   quais tokens de cor ela usa e por que o resultado é "verde"?

---

## Para aprofundar

**Documentação oficial:**
- MDN — *Using CSS custom properties (variables)*:
  https://developer.mozilla.org/pt-BR/docs/Web/CSS/Using_CSS_custom_properties
- MDN — *CSS Grid*: https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_grid_layout
- MDN — *Flexbox*: https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_flexible_box_layout
- Vite — *CSS Modules*: https://vite.dev/guide/features.html#css-modules
- CSS Modules (repositório/spec): https://github.com/css-modules/css-modules

**Vídeos / cursos (PT-BR) — confira a versão:**
- Curso CSS do *Origamid* (Flexbox/Grid/variáveis) — busque por **"Origamid CSS completo"**
  no YouTube.
- Busque por **"CSS Modules React pt-br"** e **"design tokens CSS variables pt-br"** nos
  canais *Matheus Battisti – Hora de Codar* e *Rocketseat*.

> **Ressalva**: tokens e CSS Modules mudam pouco entre versões, então vídeos um pouco
> antigos ainda valem — mas confirme que o exemplo usa **Vite** (não Create React App, que
> está descontinuado) e o sufixo `.module.css`.

---

## Questões de entrevista (estudante → pleno)

**1. (Estudante) O que é uma classe CSS?**
<details><summary>Resposta-modelo</summary>
É um "rótulo" reutilizável que agrupa regras de estilo (cor, tamanho, espaçamento) e pode ser
aplicado a vários elementos via atributo `class` (no React, `className`). Ex.: `.metricCard`
define a aparência dos cartões do Painel.
</details>

**2. (Estudante) O que é uma variável CSS (custom property) e como se usa?**
<details><summary>Resposta-modelo</summary>
É um valor nomeado declarado com `--nome: valor` (geralmente em `:root`) e lido com
`var(--nome)`. Permite reaproveitar um valor em vários lugares e trocá-lo num ponto só. No
projeto, `--color-green-700` é declarado em [global.css](../../src/global.css) e usado como
`var(--btn-primary-bg)`.
</details>

**3. (Júnior) Qual a diferença entre um CSS Module e um CSS global, e como o Vite sabe a
diferença?**
<details><summary>Resposta-modelo</summary>
CSS global aplica as classes a toda a página (risco de colisão). CSS Module dá escopo local:
as classes são renomeadas para nomes únicos no build e importadas como objeto JS. O Vite
ativa o modo Module pelo **sufixo do arquivo**: `.module.css`. `global.css` (sem o sufixo) é
global de propósito — é onde ficam reset e tokens.
</details>

**4. (Júnior) Por que evitar cores "chumbadas" (ex.: `color: #4d9d24`) e usar tokens?**
<details><summary>Resposta-modelo</summary>
Hardcode espalha o valor por dezenas de arquivos; mudar a marca vira caça manual e
inconsistente. Com tokens, a cor mora num lugar (`--color-green-700`) e tudo que usa
`var(--btn-primary-bg)` acompanha a mudança. Também facilita temas (claro/escuro) e mantém
consistência visual.
</details>

**5. (Pleno) Como você implementaria *dark mode* nesta base sem reescrever os componentes?**
<details><summary>Resposta-modelo</summary>
Como os componentes consomem **tokens semânticos**, basta redefinir os semânticos num escopo
de tema. Ex.: criar um seletor `[data-theme="dark"] { --surface-primary: #111; --text-primary:
#eee; ... }` e alternar o atributo `data-theme` no `<html>`. Nenhum `.module.css` de
componente muda — eles já leem `var(--surface-primary)`. Por isso a separação primitivos vs.
semânticos é tão valiosa.
</details>

**6. (Pleno) Quais riscos a montagem dinâmica de classe (`styles[\`badge_${variant}\`]`)
introduz e como mitigá-los?**
<details><summary>Resposta-modelo</summary>
Se `variant` produzir uma chave que não existe no CSS, `styles[...]` é `undefined` e a classe
some silenciosamente — bug visual difícil de notar. Mitigações: garantir que a função que
gera a variante só retorne valores de um conjunto fechado (como
[getActionVariant](../../src/pages/Auditoria.jsx#L112) faz, com `info` de fallback);
opcionalmente, validar/avisar em dev; e cobrir com teste de snapshot. Em TypeScript, dá para
tipar as variantes possíveis.
</details>

**7. (Pleno) Quando você trocaria CSS Modules por Tailwind ou CSS-in-JS num projeto deste
porte? Justifique o trade-off.**
<details><summary>Resposta-modelo</summary>
Trocaria por **Tailwind** se a equipe crescesse e quisesse velocidade/consistência via
utilitários e menos arquivos de CSS — aceitando HTML mais verboso e a migração do design
system para a config do Tailwind. Trocaria por **CSS-in-JS** apenas se precisasse de estilos
fortemente dependentes de props em runtime e aceitasse o custo de bundle/runtime. Para um
painel interno enxuto, CSS Modules + tokens já entrega escopo seguro e custo zero de runtime;
eu não trocaria sem um ganho concreto medido.
</details>

---

## Desafio prático (autocontido, ~1–2h)

**"Mini design system"**: num HTML+CSS puro (ou num componente React avulso), recrie uma
versão pequena do sistema de tokens.

1. Crie um `:root` com **5 primitivos** (2 cores, 1 spacing, 1 font-size, 1 radius) e **3
   semânticos** que apontem para eles (`--surface`, `--text`, `--accent`).
2. Monte **3 componentes visuais** usando só tokens: um botão-pílula, um cartão e um badge de
   status com 3 variantes (sucesso/alerta/erro).
3. Adicione um botão "alternar tema" que troque um `data-theme` no `<html>` e **redefina os
   semânticos** para um tema escuro — sem tocar no CSS dos componentes.

**Critério de sucesso**: trocar o tema muda todos os componentes de uma vez, e você não
repetiu nenhum valor hex fora do `:root`.

---

## IA no fluxo de trabalho

- **Onde acelera**: gerar a escala de tokens a partir de uma cor base, converter um CSS solto
  em CSS Module, sugerir media queries e explicar Grid/Flexbox.
- **Onde atrapalha**: a IA tende a despejar **valores hardcoded** (`#hex`, `16px`) em vez de
  usar os tokens existentes, e às vezes propõe Tailwind sem você pedir. Também pode "inventar"
  nomes de token que não existem neste `global.css`.
- **Decisão sua**: **manter a disciplina dos tokens** e a restrição da paleta de verde. Ao
  pedir CSS à IA, mande junto a lista de tokens disponíveis e exija que ela use `var(--...)`
  em vez de valores crus.
