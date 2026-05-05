# 🎯 Guia de Uso - Sistema de Penalidades de Usuários

## 📍 Localização da Funcionalidade

A funcionalidade de penalização de usuários está integrada na página de **Usuários**.

## 🚀 Como Penalizar um Usuário

### Método 1: Pelo Menu de Ações (⋮)

1. **Acesse a página de Usuários** clicando no menu lateral
2. **Localize o usuário** que deseja penalizar na tabela
3. **Clique no ícone ⋮** (três pontos) na coluna "Ações"
4. **Selecione "Penalizar"** do menu suspenso

### Método 2: Formulário de Penalidade

Após clicar em "Penalizar", um modal se abrirá com os seguintes campos:

#### 📋 Campos do Formulário

1. **Tipo de Penalidade** (Obrigatório)
   - Escolha um dos 4 tipos disponíveis
   - Cada tipo tem um ícone distintivo
   - Todos os tipos são visualmente destacados

2. **Duração da Penalidade** (Obrigatório)
   - 1 semana
   - 2 semanas
   - 1 mês
   - 3 meses
   - 6 meses

3. **Motivo da Penalidade** (Obrigatório)
   - Descreva detalhadamente o motivo
   - Mínimo de caracteres recomendado
   - Este campo está visível no histórico

## 📊 Tipos de Penalidade

| Tipo | Descrição                                   | Ícone |
| ---- | ------------------------------------------- | ----- |
| 1    | Impedimento de oferecer caronas             | ⚠️    |
| 2    | Impedimento de solicitar caronas            | ⚠️    |
| 3    | Impedimento de oferecer e solicitar caronas | 🚫    |
| 4    | Suspensão de conta                          | 👤❌  |

## ✅ Checklist Antes de Penalizar

- [ ] Usuário identificado corretamente
- [ ] Tipo de penalidade apropriado selecionado
- [ ] Duração condizente com a infração
- [ ] Motivo descritivo e documentado
- [ ] Botão "Aplicar Penalidade" habilitado

## 🎨 Elementos Visuais

### Modal de Penalidades

- **Overlay**: Fundo escuro com blur para foco
- **Informação do Usuário**: Avatar + Nome + Email no topo
- **Animação**: Slide up suave ao abrir/fechar
- **Botões**:
  - Cancelar (cinza)
  - Aplicar Penalidade (vermelho)

### Menu de Ações (⋮)

- **Posição**: Lado direito de cada linha
- **Animação**: Rotaciona ao hover
- **Menu**: Slide down com 5 opções:
  - 👁️ Ver Detalhes
  - ✏️ Editar
  - 🛡️ Penalizar
  - ➖ Divisor
  - 🗑️ Deletar

## 🔔 Feedback e Confirmação

Após clicar em "Aplicar Penalidade":

1. **Botão mostra estado de carregamento**: "Penalizando..."
2. **Modal fecha automaticamente** após sucesso
3. **(Próxima iteração)**: Toast notification com mensagem de sucesso

## ⚠️ Avisos Importantes

- Penalidades de **Suspensão de Conta (Tipo 4)** impedem completamente o acesso
- A **Duração** começará a contar a partir do momento da aplicação
- O **Motivo** é registrado para auditoria e histórico
- Penalidades podem ser **revogadas** (funcionalidade em desenvolvimento)

## 🔧 Funcionalidades em Desenvolvimento

- ✓ Modal de penalidades
- ✓ Menu de ações contextual
- ⏳ Toast notifications
- ⏳ Histórico de penalidades
- ⏳ Revogação de penalidades
- ⏳ Integração com API backend
- ⏳ Email de notificação ao usuário

## 💡 Dicas

1. **Use motivos descritivos** - Facilita a revisão posterior
2. **Considere progressão** - Comece com duração menor
3. **Documente tudo** - O motivo fica registrado para auditoria
4. **Revise antes de enviar** - O botão de envio fica desabilitado até preencher

## 📞 Suporte

Para dúvidas sobre a funcionalidade:

- Verifique os comentários no código
- Consulte o CHANGELOG.md para histórico
- Entre em contato com o desenvolvedor

---

**Última atualização**: Maio 2026
