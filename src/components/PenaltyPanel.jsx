// ============================================================
// components/PenaltyPanel.jsx — Painel lateral completo de penalidades
//
// Painel que cobre toda a tela para gerenciar as penalidades de um usuário.
// É aberto a partir de Usuarios.jsx ao clicar em "Penalizar" no menu de ações.
//
// Funcionalidades:
//   - Exibe o usuário selecionado com contador de penalidades ativas
//   - Lista o histórico de penalidades com filtro: Todas / Ativas / Inativas
//   - Formulário para aplicar uma nova penalidade:
//       tipo (1-4), duração (obrigatória exceto para tipo 4 = suspensão),
//       motivo (opcional)
//   - Botão "Remover" individual para cada penalidade ativa
//   - Aviso especial quando o tipo 4 (Suspensão) é selecionado
//
// Diferença entre Tipo 4 e os outros:
//   O tipo 4 (Suspensão de conta) é permanente — bloqueia o login.
//   Por isso, quando selecionado, o campo "Duração" é desabilitado
//   e exibe "Permanente (suspensão)".
//
// useCallback para loadPenalties:
//   loadPenalties é envolvido em useCallback para que sua referência
//   (endereço de memória) não mude a cada renderização do componente.
//   Isso é necessário porque ela é listada como dependência no useEffect:
//   sem useCallback, o useEffect rodaria em loop infinito.
//
// Props (parâmetros recebidos pelo componente):
//   user    → objeto do usuário com campos usu_id e usu_nome (e usu_email)
//   onClose → função para fechar o painel e voltar para Usuarios.jsx
//
// Interligação:
//   - Importado por: Usuarios.jsx
//   - Importa: api.js (getPenalidades, applyPenalidade, removePenalidade)
//   - mockData.js (penaltiesData) como fallback se a API falhar
//   - Lucide React: Ban, Loader2, AlertCircle, CheckCircle,
//                   Trash2, Plus, X, ShieldAlert, Clock, UserX, ArrowLeft
//
// Estilo: PenaltyPanel.module.css
//   Classes CSS utilizadas:
//     .overlay         → div semitransparente que escurece o fundo
//     .panel           → painel lateral cobrindo a tela inteira (posição fixed)
//     .panelHeader     → cabeçalho com título e botão "Voltar"
//     .panelTitle      → título "Penalidades" + subtítulo
//     .closeBtn        → botão "← Voltar para Usuários"
//     .panelBody       → área de scroll do conteúdo
//     .inner           → container interno com largura máxima
//     .userCard        → card com dados do usuário + botão "Aplicar Penalidade"
//     .userCardLeft    → lado esquerdo: avatar + nome/email + badge ativo
//     .userAvatar      → círculo com iniciais do usuário
//     .userName        → nome do usuário
//     .userEmail       → email do usuário
//     .activeBadge     → badge vermelho com contagem de penalidades ativas
//     .primaryBtn      → botão "Aplicar Penalidade" (azul)
//     .formCard        → card do formulário de nova penalidade
//     .formCardHeader  → cabeçalho do formulário com título e botão fechar
//     .sectionLabel    → rótulo de seção com ícone (ex: "Nova penalidade")
//     .ghostBtn        → botão transparente (cancelar, fechar)
//     .formGrid        → grade de campos do formulário
//     .formGroup       → grupo label + campo
//     .formGroupFull   → grupo que ocupa a largura toda (motivo)
//     .label           → etiqueta do campo
//     .required        → asterisco vermelho (*) de campo obrigatório
//     .input           → select/input de campo
//     .textarea        → campo de texto do motivo
//     .charCount       → contador "X/255" de caracteres do motivo
//     .suspensionWarning → caixa de aviso amarela para tipo 4
//     .alertError      → caixa de mensagem de erro
//     .alertSuccess    → caixa de mensagem de sucesso
//     .formActions     → linha com botões "Aplicar" e "Cancelar"
//     .dangerBtn       → botão vermelho "Aplicar Penalidade"
//     .spin            → animação de rotação (para Loader2)
//     .listSection     → seção da lista de penalidades
//     .listHeader      → cabeçalho da lista com título e filtros
//     .listTitle       → "Histórico de penalidades"
//     .filterTabs      → linha de filtros Todas/Ativas/Inativas
//     .filterBtn       → botão individual de filtro
//     .filterActive    → estilo do filtro selecionado
//     .loadingState    → spinner centralizado enquanto carrega a lista
//     .emptyState      → estado vazio da lista (ícone + texto)
//     .penaltyList     → container das penalidades
//     .penaltyCard     → card de uma penalidade individual
//     .penaltyInactive → estilo mais fraco para penalidades expiradas/removidas
//     .penaltyCardLeft → lado esquerdo: ícone + informações da penalidade
//     .penaltyIcon     → círculo com ícone da penalidade
//     .icon_warning    → fundo amarelo (tipos 1 e 2)
//     .icon_danger     → fundo vermelho (tipo 3)
//     .icon_critical   → fundo vermelho escuro (tipo 4 — suspensão)
//     .penaltyInfo     → coluna com tipo, motivo, datas
//     .penaltyTop      → linha com tipo e status badge
//     .penaltyTipo     → texto "Tipo X — descrição"
//     .statusBadge     → badge de status da penalidade (ativa/expirada/removida)
//     .status_ativa    → badge verde
//     .status_expirada → badge cinza
//     .status_removida → badge cinza
//     .penaltyMotivo   → texto do motivo da penalidade
//     .penaltyMeta     → linha com data de aplicação e expiração
//     .removeBtn       → botão "Remover" (aparece apenas em penalidades ativas)
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import {
  Ban, Loader2, AlertCircle, CheckCircle,
  Trash2, Plus, X, ShieldAlert, Clock, UserX, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { penaltiesData } from '../data/mockData';
import styles from './PenaltyPanel.module.css';

// TIPO_LABELS: descrição textual de cada tipo de penalidade.
const TIPO_LABELS = {
  1: 'Impedimento de oferecer caronas',
  2: 'Impedimento de solicitar caronas',
  3: 'Impedimento de oferecer e solicitar caronas',
  4: 'Suspensão de conta'
};

// TIPO_ICONS: componente de ícone para cada tipo de penalidade.
const TIPO_ICONS = {
  1: ShieldAlert,
  2: ShieldAlert,
  3: Ban,
  4: UserX
};

// TIPO_SEVERITY: categoria de cor/gravidade para estilização do ícone.
const TIPO_SEVERITY = {
  1: 'warning',   // amarelo
  2: 'warning',   // amarelo
  3: 'danger',    // vermelho
  4: 'critical'   // vermelho escuro
};

// Opções de duração disponíveis no formulário de nova penalidade.
const DURACAO_OPTIONS = [
  { value: '1semana',  label: '1 semana' },
  { value: '2semanas', label: '2 semanas' },
  { value: '1mes',     label: '1 mês' },
  { value: '3meses',   label: '3 meses' },
  { value: '6meses',   label: '6 meses' }
];

// formatDate: formata data ISO para o padrão brasileiro com horário.
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// isPenaltyActive: verifica se uma penalidade está atualmente ativa.
// Uma penalidade ativa precisa:
//   1. ter pen_ativo = true
//   2. não ter expirado (ou ser permanente, sem data de expiração)
function isPenaltyActive(pen) {
  if (!pen.pen_ativo) return false;
  if (!pen.pen_expira_em) return true;  // sem data = permanente = sempre ativa
  return new Date(pen.pen_expira_em) > new Date();  // ainda não expirou?
}

// getPenaltyStatus: retorna o status textual de uma penalidade.
// Usado para determinar qual badge exibir e quais aparecem no filtro "Ativas".
function getPenaltyStatus(pen) {
  if (!pen.pen_ativo) return 'removida';
  if (pen.pen_expira_em && new Date(pen.pen_expira_em) <= new Date()) return 'expirada';
  return 'ativa';
}

// getInitials: gera as iniciais do nome para o avatar.
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

export function PenaltyPanel({ user, onClose }) {
  // Estados da lista de penalidades
  const [penalties, setPenalties] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  // filterStatus: qual filtro de aba está ativo ('Todas', 'Ativas', 'Inativas')
  const [filterStatus, setFilterStatus] = useState('Todas');

  // showForm: controla se o formulário de nova penalidade está visível
  const [showForm, setShowForm] = useState(false);

  // form: estado dos campos do formulário de nova penalidade
  const [form, setForm] = useState({ pen_tipo: '', pen_duracao: '', pen_motivo: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // removeLoading: ID da penalidade sendo removida (para spinner individual)
  const [removeLoading, setRemoveLoading] = useState(null);
  const [removeError, setRemoveError] = useState('');

  // userId: obtém o ID do usuário, suportando dois formatos de objeto
  // (formato da API com usu_id, ou formato do mock com id)
  const userId = user?.usu_id ?? user?.id;

  // loadPenalties: busca as penalidades do usuário na API.
  // useCallback → memoriza a função para que sua referência não mude a cada render.
  // Sem useCallback, o useEffect abaixo entraria em loop infinito porque
  // loadPenalties estaria listada como dependência mas seria recriada a cada render.
  const loadPenalties = useCallback(async (id) => {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.getPenalidades(id);
      // ?? [] → usa array vazio se penalidades for null/undefined
      setPenalties(data.penalidades ?? []);
    } catch {
      // Fallback: usa dados mock indexados pelo ID do usuário
      setPenalties(penaltiesData[id] ?? []);
    } finally {
      setListLoading(false);
    }
  }, []); // [] → useCallback não tem dependências externas

  // useEffect: quando o usuário muda (ex: outro usuário penalizado),
  // reseta todos os estados e recarrega as penalidades do novo usuário.
  // [userId, loadPenalties] → roda novamente se qualquer um desses mudar.
  useEffect(() => {
    if (userId) {
      setPenalties([]);
      setShowForm(false);
      setForm({ pen_tipo: '', pen_duracao: '', pen_motivo: '' });
      setFormError('');
      setFormSuccess('');
      setRemoveError('');
      loadPenalties(userId);
    }
  }, [userId, loadPenalties]);

  // handleFormChange: atualiza o campo que mudou no formulário.
  // Caso especial: ao selecionar tipo 4 (Suspensão), limpa a duração
  // pois suspensão é permanente e não tem duração.
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'pen_tipo' && value === '4') next.pen_duracao = '';
      return next;
    });
  }

  async function handleApply(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // parseInt converte a string do select para número inteiro
    const tipo = parseInt(form.pen_tipo);

    // Validações antes de chamar a API
    if (!tipo) { setFormError('Selecione o tipo de penalidade.'); return; }
    if (tipo !== 4 && !form.pen_duracao) { setFormError('Selecione a duração.'); return; }

    setFormLoading(true);
    try {
      const payload = {
        pen_tipo: tipo,
        // .trim() remove espaços; || undefined → não envia campo vazio
        pen_motivo: form.pen_motivo.trim() || undefined,
        // Spread condicional: adiciona pen_duracao apenas se NÃO for tipo 4
        ...(tipo !== 4 ? { pen_duracao: form.pen_duracao } : {})
      };
      await api.applyPenalidade(userId, payload);
      setFormSuccess(`Penalidade tipo ${tipo} aplicada com sucesso.`);
      setForm({ pen_tipo: '', pen_duracao: '', pen_motivo: '' });
      setShowForm(false);
      // Recarrega a lista para mostrar a nova penalidade
      loadPenalties(userId);
    } catch (err) {
      setFormError(err.message || 'Erro ao aplicar penalidade.');
    } finally {
      setFormLoading(false);
    }
  }

  // handleRemove: remove uma penalidade específica pelo ID.
  // removeLoading = penId → mostra spinner apenas no botão dessa penalidade.
  async function handleRemove(penId) {
    setRemoveLoading(penId);
    setRemoveError('');
    try {
      await api.removePenalidade(penId);
      loadPenalties(userId);  // recarrega para refletir a remoção
    } catch (err) {
      setRemoveError(err.message || 'Erro ao remover penalidade.');
    } finally {
      setRemoveLoading(null);
    }
  }

  // filteredPenalties: aplica o filtro de aba à lista de penalidades.
  const filteredPenalties = penalties.filter(pen => {
    const status = getPenaltyStatus(pen);
    if (filterStatus === 'Ativas') return status === 'ativa';
    if (filterStatus === 'Inativas') return status === 'expirada' || status === 'removida';
    return true;  // 'Todas' → retorna tudo
  });

  // Conta quantas penalidades estão atualmente ativas para o badge do usuário
  const activePenaltiesCount = penalties.filter(p => isPenaltyActive(p)).length;

  // Guarda: se não há usuário, não renderiza nada
  if (!user) return null;

  // Suporta dois formatos de objeto de usuário (API vs mock)
  const userName = user.usu_nome ?? user.name;
  const userEmail = user.usu_email ?? user.email;

  return (
    // Fragment (<>) → permite renderizar overlay + painel sem div extra
    <>
      {/* Overlay: fundo escuro semitransparente que cobre a tela atrás do painel */}
      <div className={styles.overlay} />

      {/* Painel principal: posição fixed cobrindo toda a tela */}
      <div className={styles.panel}>

        {/* ── Cabeçalho do painel ── */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div>
              <h1>Penalidades</h1>
              <p>Consulte, aplique e remova penalidades de usuários</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <ArrowLeft size={16} />
            Voltar para Usuários
          </button>
        </div>

        {/* ── Corpo com scroll ── */}
        <div className={styles.panelBody}>
          <div className={styles.inner}>

            {/* Card do usuário selecionado */}
            <div className={styles.userCard}>
              <div className={styles.userCardLeft}>
                <span className={styles.userAvatar}>{getInitials(userName)}</span>
                <div>
                  <p className={styles.userName}>{userName}</p>
                  <p className={styles.userEmail}>{userEmail}</p>
                </div>
                {/* Badge de penalidades ativas: só aparece se houver ao menos 1 */}
                {activePenaltiesCount > 0 && (
                  <span className={styles.activeBadge}>
                    {activePenaltiesCount} ativa{activePenaltiesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {/* Botão "Aplicar Penalidade" só aparece se o formulário estiver oculto */}
              {!showForm && (
                <button
                  className={styles.primaryBtn}
                  onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
                >
                  <Plus size={16} />
                  Aplicar Penalidade
                </button>
              )}
            </div>

            {/* ── Formulário de nova penalidade (visível apenas quando showForm = true) ── */}
            {showForm && (
              <div className={styles.formCard}>
                <div className={styles.formCardHeader}>
                  <div className={styles.sectionLabel}>
                    <Ban size={15} />
                    Nova penalidade
                  </div>
                  {/* Botão X para fechar o formulário sem aplicar */}
                  <button className={styles.ghostBtn} onClick={() => setShowForm(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleApply}>
                  <div className={styles.formGrid}>

                    {/* Campo: Tipo de penalidade */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Tipo <span className={styles.required}>*</span>
                      </label>
                      <select name="pen_tipo" className={styles.input} value={form.pen_tipo} onChange={handleFormChange}>
                        <option value="">Selecione...</option>
                        <option value="1">1 — Impedir de oferecer caronas</option>
                        <option value="2">2 — Impedir de solicitar caronas</option>
                        <option value="3">3 — Impedir oferecer e solicitar</option>
                        <option value="4">4 — Suspender conta (permanente)</option>
                      </select>
                    </div>

                    {/* Campo: Duração (desabilitado para tipo 4 = suspensão permanente) */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Duração {form.pen_tipo !== '4' && <span className={styles.required}>*</span>}
                      </label>
                      <select
                        name="pen_duracao"
                        className={styles.input}
                        value={form.pen_duracao}
                        onChange={handleFormChange}
                        disabled={form.pen_tipo === '4'}  // desabilitado para suspensão
                      >
                        <option value="">{form.pen_tipo === '4' ? 'Permanente (suspensão)' : 'Selecione...'}</option>
                        {DURACAO_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campo: Motivo (textarea ocupa a linha toda via formGroupFull) */}
                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Motivo</label>
                      <textarea
                        name="pen_motivo"
                        className={styles.textarea}
                        rows={2}
                        maxLength={255}  // limite máximo de caracteres
                        placeholder="Descreva o motivo da penalidade (opcional)..."
                        value={form.pen_motivo}
                        onChange={handleFormChange}
                      />
                      {/* Contador de caracteres: atualiza em tempo real */}
                      <span className={styles.charCount}>{form.pen_motivo.length}/255</span>
                    </div>
                  </div>

                  {/* Aviso especial para tipo 4 (Suspensão de conta) */}
                  {form.pen_tipo === '4' && (
                    <div className={styles.suspensionWarning}>
                      <AlertCircle size={15} />
                      A suspensão bloqueia o login do usuário e cancela todas as caronas ativas. Esta ação é permanente até ser removida manualmente.
                    </div>
                  )}

                  {/* Mensagem de erro do formulário */}
                  {formError && (
                    <div className={styles.alertError}><AlertCircle size={15} /> {formError}</div>
                  )}

                  <div className={styles.formActions}>
                    {/* Botão vermelho de confirmação com spinner */}
                    <button type="submit" className={styles.dangerBtn} disabled={formLoading}>
                      {formLoading
                        ? <><Loader2 size={15} className={styles.spin} /> Aplicando...</>
                        : <><Ban size={15} /> Aplicar Penalidade</>}
                    </button>
                    <button type="button" className={styles.ghostBtn} onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Mensagens globais de sucesso e erro de remoção */}
            {formSuccess && (
              <div className={styles.alertSuccess}><CheckCircle size={15} /> {formSuccess}</div>
            )}
            {removeError && (
              <div className={styles.alertError}><AlertCircle size={15} /> {removeError}</div>
            )}

            {/* ── Lista de penalidades ── */}
            <div className={styles.listSection}>
              <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>Histórico de penalidades</h2>

                {/* Filtros: Todas / Ativas / Inativas */}
                <div className={styles.filterTabs}>
                  {['Todas', 'Ativas', 'Inativas'].map(f => (
                    <button
                      key={f}
                      className={`${styles.filterBtn} ${filterStatus === f ? styles.filterActive : ''}`}
                      onClick={() => setFilterStatus(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spinner enquanto carrega a lista */}
              {listLoading && (
                <div className={styles.loadingState}>
                  <Loader2 size={20} className={styles.spin} />
                  <span>Carregando penalidades...</span>
                </div>
              )}

              {/* Erro ao carregar a lista */}
              {listError && !listLoading && (
                <div className={styles.alertError}><AlertCircle size={15} /> {listError}</div>
              )}

              {/* Estado vazio: nenhuma penalidade encontrada */}
              {!listLoading && filteredPenalties.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle size={32} />
                  <p>{filterStatus === 'Ativas' ? 'Nenhuma penalidade ativa.' : 'Nenhuma penalidade encontrada.'}</p>
                </div>
              )}

              {/* Cards de penalidade */}
              <div className={styles.penaltyList}>
                {filteredPenalties.map(pen => {
                  const status = getPenaltyStatus(pen);
                  const active = status === 'ativa';

                  // ?? Ban → usa Ban como ícone padrão se o tipo não estiver no mapa
                  const Icon = TIPO_ICONS[pen.pen_tipo] ?? Ban;
                  const severity = TIPO_SEVERITY[pen.pen_tipo];

                  return (
                    <div
                      key={pen.pen_id}
                      // styles.penaltyInactive → opacidade reduzida para penalidades inativas
                      className={`${styles.penaltyCard} ${!active ? styles.penaltyInactive : ''}`}
                    >
                      <div className={styles.penaltyCardLeft}>
                        {/* Ícone com cor de fundo baseada na severidade:
                            styles[`icon_${severity}`] → icon_warning, icon_danger, icon_critical */}
                        <div className={`${styles.penaltyIcon} ${styles[`icon_${severity}`]}`}>
                          <Icon size={18} />
                        </div>

                        <div className={styles.penaltyInfo}>
                          <div className={styles.penaltyTop}>
                            <span className={styles.penaltyTipo}>
                              Tipo {pen.pen_tipo} — {TIPO_LABELS[pen.pen_tipo]}
                            </span>
                            {/* Badge de status com cor dinâmica: status_ativa, status_expirada, etc. */}
                            <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
                              {/* charAt(0).toUpperCase() → capitaliza a primeira letra */}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>

                          {/* Motivo: só exibe se estiver preenchido */}
                          {pen.pen_motivo && (
                            <p className={styles.penaltyMotivo}>{pen.pen_motivo}</p>
                          )}

                          {/* Datas de aplicação e expiração */}
                          <div className={styles.penaltyMeta}>
                            <span><Clock size={12} /> Aplicada em {formatDate(pen.pen_aplicado_em)}</span>
                            <span>
                              {pen.pen_expira_em
                                ? `Expira em ${formatDate(pen.pen_expira_em)}`
                                : pen.pen_tipo === 4 ? 'Permanente' : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão "Remover": só aparece em penalidades ativas.
                          removeLoading === pen.pen_id → spinner só neste botão */}
                      {active && (
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemove(pen.pen_id)}
                          disabled={removeLoading === pen.pen_id}
                          title="Remover penalidade"
                        >
                          {removeLoading === pen.pen_id
                            ? <Loader2 size={15} className={styles.spin} />
                            : <Trash2 size={15} />}
                          Remover
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
