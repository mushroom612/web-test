import { useState, useCallback, useEffect } from 'react';
import {
  Ban, Loader2, AlertCircle, CheckCircle,
  Trash2, Plus, X, ShieldAlert, Clock, UserX, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { penaltiesData } from '../data/mockData';
import styles from './PenaltyPanel.module.css';

const TIPO_LABELS = {
  1: 'Impedimento de oferecer caronas',
  2: 'Impedimento de solicitar caronas',
  3: 'Impedimento de oferecer e solicitar caronas',
  4: 'Suspensão de conta'
};

const TIPO_ICONS = {
  1: ShieldAlert,
  2: ShieldAlert,
  3: Ban,
  4: UserX
};

const TIPO_SEVERITY = {
  1: 'warning',
  2: 'warning',
  3: 'danger',
  4: 'critical'
};

const DURACAO_OPTIONS = [
  { value: '1semana',  label: '1 semana' },
  { value: '2semanas', label: '2 semanas' },
  { value: '1mes',     label: '1 mês' },
  { value: '3meses',   label: '3 meses' },
  { value: '6meses',   label: '6 meses' }
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function isPenaltyActive(pen) {
  if (!pen.pen_ativo) return false;
  if (!pen.pen_expira_em) return true;
  return new Date(pen.pen_expira_em) > new Date();
}

function getPenaltyStatus(pen) {
  if (!pen.pen_ativo) return 'removida';
  if (pen.pen_expira_em && new Date(pen.pen_expira_em) <= new Date()) return 'expirada';
  return 'ativa';
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

export function PenaltyPanel({ user, onClose }) {
  const [penalties, setPenalties] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [filterStatus, setFilterStatus] = useState('Todas');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ pen_tipo: '', pen_duracao: '', pen_motivo: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [removeLoading, setRemoveLoading] = useState(null);
  const [removeError, setRemoveError] = useState('');

  const userId = user?.usu_id ?? user?.id;

  const loadPenalties = useCallback(async (id) => {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.getPenalidades(id);
      setPenalties(data.penalidades ?? []);
    } catch {
      setPenalties(penaltiesData[id] ?? []);
    } finally {
      setListLoading(false);
    }
  }, []);

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
    const tipo = parseInt(form.pen_tipo);
    if (!tipo) { setFormError('Selecione o tipo de penalidade.'); return; }
    if (tipo !== 4 && !form.pen_duracao) { setFormError('Selecione a duração.'); return; }

    setFormLoading(true);
    try {
      const payload = {
        pen_tipo: tipo,
        pen_motivo: form.pen_motivo.trim() || undefined,
        ...(tipo !== 4 ? { pen_duracao: form.pen_duracao } : {})
      };
      await api.applyPenalidade(userId, payload);
      setFormSuccess(`Penalidade tipo ${tipo} aplicada com sucesso.`);
      setForm({ pen_tipo: '', pen_duracao: '', pen_motivo: '' });
      setShowForm(false);
      loadPenalties(userId);
    } catch (err) {
      setFormError(err.message || 'Erro ao aplicar penalidade.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleRemove(penId) {
    setRemoveLoading(penId);
    setRemoveError('');
    try {
      await api.removePenalidade(penId);
      loadPenalties(userId);
    } catch (err) {
      setRemoveError(err.message || 'Erro ao remover penalidade.');
    } finally {
      setRemoveLoading(null);
    }
  }

  const filteredPenalties = penalties.filter(pen => {
    const status = getPenaltyStatus(pen);
    if (filterStatus === 'Ativas') return status === 'ativa';
    if (filterStatus === 'Inativas') return status === 'expirada' || status === 'removida';
    return true;
  });

  const activePenaltiesCount = penalties.filter(p => isPenaltyActive(p)).length;

  if (!user) return null;

  const userName = user.usu_nome ?? user.name;
  const userEmail = user.usu_email ?? user.email;

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.panel}>
        {/* Cabeçalho estilo página */}
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

        {/* Conteúdo */}
        <div className={styles.panelBody}>
          <div className={styles.inner}>

            {/* Usuário selecionado */}
            <div className={styles.userCard}>
              <div className={styles.userCardLeft}>
                <span className={styles.userAvatar}>{getInitials(userName)}</span>
                <div>
                  <p className={styles.userName}>{userName}</p>
                  <p className={styles.userEmail}>{userEmail}</p>
                </div>
                {activePenaltiesCount > 0 && (
                  <span className={styles.activeBadge}>
                    {activePenaltiesCount} ativa{activePenaltiesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
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

            {/* Formulário */}
            {showForm && (
              <div className={styles.formCard}>
                <div className={styles.formCardHeader}>
                  <div className={styles.sectionLabel}>
                    <Ban size={15} />
                    Nova penalidade
                  </div>
                  <button className={styles.ghostBtn} onClick={() => setShowForm(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleApply}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Tipo <span className={styles.required}>*</span></label>
                      <select name="pen_tipo" className={styles.input} value={form.pen_tipo} onChange={handleFormChange}>
                        <option value="">Selecione...</option>
                        <option value="1">1 — Impedir de oferecer caronas</option>
                        <option value="2">2 — Impedir de solicitar caronas</option>
                        <option value="3">3 — Impedir oferecer e solicitar</option>
                        <option value="4">4 — Suspender conta (permanente)</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Duração {form.pen_tipo !== '4' && <span className={styles.required}>*</span>}
                      </label>
                      <select
                        name="pen_duracao"
                        className={styles.input}
                        value={form.pen_duracao}
                        onChange={handleFormChange}
                        disabled={form.pen_tipo === '4'}
                      >
                        <option value="">{form.pen_tipo === '4' ? 'Permanente (suspensão)' : 'Selecione...'}</option>
                        {DURACAO_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Motivo</label>
                      <textarea
                        name="pen_motivo"
                        className={styles.textarea}
                        rows={2}
                        maxLength={255}
                        placeholder="Descreva o motivo da penalidade (opcional)..."
                        value={form.pen_motivo}
                        onChange={handleFormChange}
                      />
                      <span className={styles.charCount}>{form.pen_motivo.length}/255</span>
                    </div>
                  </div>

                  {form.pen_tipo === '4' && (
                    <div className={styles.suspensionWarning}>
                      <AlertCircle size={15} />
                      A suspensão bloqueia o login do usuário e cancela todas as caronas ativas. Esta ação é permanente até ser removida manualmente.
                    </div>
                  )}

                  {formError && (
                    <div className={styles.alertError}><AlertCircle size={15} /> {formError}</div>
                  )}

                  <div className={styles.formActions}>
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

            {formSuccess && (
              <div className={styles.alertSuccess}><CheckCircle size={15} /> {formSuccess}</div>
            )}
            {removeError && (
              <div className={styles.alertError}><AlertCircle size={15} /> {removeError}</div>
            )}

            {/* Lista de penalidades */}
            <div className={styles.listSection}>
              <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>Histórico de penalidades</h2>
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

              {listLoading && (
                <div className={styles.loadingState}>
                  <Loader2 size={20} className={styles.spin} />
                  <span>Carregando penalidades...</span>
                </div>
              )}

              {listError && !listLoading && (
                <div className={styles.alertError}><AlertCircle size={15} /> {listError}</div>
              )}

              {!listLoading && filteredPenalties.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle size={32} />
                  <p>{filterStatus === 'Ativas' ? 'Nenhuma penalidade ativa.' : 'Nenhuma penalidade encontrada.'}</p>
                </div>
              )}

              <div className={styles.penaltyList}>
                {filteredPenalties.map(pen => {
                  const status = getPenaltyStatus(pen);
                  const active = status === 'ativa';
                  const Icon = TIPO_ICONS[pen.pen_tipo] ?? Ban;
                  const severity = TIPO_SEVERITY[pen.pen_tipo];

                  return (
                    <div
                      key={pen.pen_id}
                      className={`${styles.penaltyCard} ${!active ? styles.penaltyInactive : ''}`}
                    >
                      <div className={styles.penaltyCardLeft}>
                        <div className={`${styles.penaltyIcon} ${styles[`icon_${severity}`]}`}>
                          <Icon size={18} />
                        </div>
                        <div className={styles.penaltyInfo}>
                          <div className={styles.penaltyTop}>
                            <span className={styles.penaltyTipo}>
                              Tipo {pen.pen_tipo} — {TIPO_LABELS[pen.pen_tipo]}
                            </span>
                            <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                          {pen.pen_motivo && (
                            <p className={styles.penaltyMotivo}>{pen.pen_motivo}</p>
                          )}
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
