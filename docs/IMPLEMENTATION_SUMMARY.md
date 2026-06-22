# Resumo da Implementação — Sistema de Penalidades

> ℹ️ **Atualização (jun/2026).** A primeira versão deste recurso foi prototipada como
> um *modal* (`PenaltyModal`) com dados fictícios. A versão atual evoluiu para um
> **painel lateral** ([`PenaltyPanel.jsx`](../src/components/PenaltyPanel.jsx))
> **integrado à API real**. Este documento descreve o estado **atual**.

## Objetivo

Permitir que administradores/desenvolvedores apliquem, consultem e removam
penalidades de um usuário, a partir do menu de ações da tabela de **Usuários**.

## Componentes

### 1. PenaltyPanel.jsx ⭐ — Painel lateral de penalidades

Painel que cobre a tela (posição `fixed` com overlay), aberto a partir de
`Usuarios.jsx`. Responsável por todo o ciclo de vida das penalidades de um usuário.

**Props:**

```jsx
<PenaltyPanel
  user={selectedUser}   // objeto do usuário (usu_id, usu_nome, usu_email)
  onClose={() => {}}    // fecha o painel e volta para Usuarios.jsx
/>
```

**Funcionalidades:**

- Exibe o usuário selecionado com **contador de penalidades ativas**
- Lista o **histórico** com filtro: Todas / Ativas / Inativas
- Formulário para **aplicar** nova penalidade: tipo (1–4), duração e motivo
- Botão **Remover** individual para cada penalidade ativa
- Aviso especial quando o tipo 4 (Suspensão) é selecionado

**Integração com a API** ([`api.js`](../src/services/api.js)):

- `getPenalidades(userId, { ativas, page, limit })` → carrega o histórico
- `applyPenalidade(userId, { pen_tipo, pen_duracao, pen_motivo })` → aplica
- `removePenalidade(penId)` → remove

**Estilo:** `PenaltyPanel.module.css` (overlay, painel fixed, formulário, lista).

### 2. UserActionsMenu.jsx — Menu contextual (⋮) do usuário

Menu aberto pelo ícone de três pontos em cada linha da tabela, com a opção
**Penalizar** (entre outras ações como Ver detalhes e Editar). É ele que dispara a
abertura do `PenaltyPanel`.

## Tipos de penalidade

| ID | Tipo | Duração | Ícone |
|----|------|---------|-------|
| 1 | Impedimento de **oferecer** caronas | obrigatória | ShieldAlert |
| 2 | Impedimento de **solicitar** caronas | obrigatória | ShieldAlert |
| 3 | Impedimento de **oferecer e solicitar** | obrigatória | Ban |
| 4 | **Suspensão de conta** (bloqueia o login) | permanente (campo desabilitado) | UserX |

> O tipo 4 é permanente: ao selecioná-lo, o campo "Duração" é desabilitado e
> exibe "Permanente (suspensão)".

## Fluxo de integração

```
Usuarios.jsx
├── estado: usuário selecionado + painel aberto/fechado
│
├── UserActionsMenu (em cada linha)
│   └── "Penalizar" → abre o PenaltyPanel com o usuário
│
└── PenaltyPanel
    ├── getPenalidades()  → carrega o histórico
    ├── applyPenalidade() → aplica nova penalidade
    └── removePenalidade()→ remove penalidade ativa
```

## Arquivos do recurso

```
src/components/PenaltyPanel.jsx
src/components/PenaltyPanel.module.css
src/components/UserActionsMenu.jsx
src/components/UserActionsMenu.module.css
src/pages/Usuarios.jsx        (integra os componentes)
```

## Casos de uso

**Comportamento inadequado** — Admin localiza o usuário → ⋮ → Penalizar →
"Impedimento de oferecer caronas", duração 1 mês, motivo descrito → Aplicar.

**Suspensão por fraude** — Usuário cria múltiplas contas falsas → Admin aplica
"Suspensão de conta" com o motivo documentado.

## Boas práticas adotadas

- Confirmação/validação antes de ações destrutivas
- Estados de *loading* e mensagens de erro claras
- Feedback visual durante as operações
- CSS Modules para escopo isolado de estilos
- Responsividade (mobile / tablet / desktop)

## Possíveis melhorias futuras

- Notificações (toast) de sucesso/erro mais ricas
- E-mail/push ao usuário penalizado
- Relatórios e estatísticas de penalidades por período
