import { useState } from 'react';
import {
  ArrowLeft, Edit2, Save, X, User, Mail, Phone,
  Building2, BookOpen, ShieldCheck, Clock, Monitor,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { usersData } from '../data/mockData';
import { api } from '../services/api';
import styles from './UserProfilePanel.module.css';

const VERIFICACAO_LABELS = {
  0: { label: 'Aguardando OTP', color: 'warning' },
  1: { label: 'Admin verificado', color: 'success' },
  2: { label: 'Verificado', color: 'success' },
  5: { label: 'Cadastro pendente', color: 'warning' },
  6: { label: 'Veículo pendente', color: 'warning' },
  9: { label: 'Suspenso', color: 'danger' }
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function enrichUser(apiUser) {
  const mock = usersData.find(
    u => u.email === apiUser.usu_email || u.id === apiUser.usu_id
  );
  return {
    usu_id: apiUser.usu_id,
    usu_nome: apiUser.usu_nome,
    usu_email: apiUser.usu_email,
    usu_status: apiUser.usu_status,
    usu_verificacao: apiUser.usu_verificacao,
    usu_telefone: apiUser.usu_telefone ?? null,
    school: mock?.school ?? '—',
    course: mock?.course ?? '—',
    type: mock?.type ?? '—',
    lastAccess: mock?.lastAccess ?? null,
    ipLogin: mock?.ipLogin ?? null
  };
}

export function UserProfilePanel({ user, initialMode = 'view', onClose, onUserUpdated }) {
  const enriched = enrichUser(user);

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    usu_nome: enriched.usu_nome,
    usu_telefone: enriched.usu_telefone ?? '',
    usu_status: enriched.usu_status
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const verif = VERIFICACAO_LABELS[enriched.usu_verificacao] ?? { label: 'Desconhecido', color: 'neutral' };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    if (!form.usu_nome.trim()) { setSaveError('O nome não pode estar vazio.'); return; }

    setSaving(true);
    try {
      await api.updateUser(enriched.usu_id, {
        usu_nome: form.usu_nome.trim(),
        usu_telefone: form.usu_telefone.trim() || null,
        usu_status: Number(form.usu_status)
      });
      setSaveSuccess('Dados atualizados com sucesso.');
      setMode('view');
      onUserUpdated?.({
        ...user,
        usu_nome: form.usu_nome.trim(),
        usu_status: Number(form.usu_status)
      });
    } catch (err) {
      setSaveError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      usu_nome: enriched.usu_nome,
      usu_telefone: enriched.usu_telefone ?? '',
      usu_status: enriched.usu_status
    });
    setSaveError('');
    setMode('view');
  }

  return (
    <div className={styles.panel}>
      {/* Cabeçalho */}
      <div className={styles.panelHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <ArrowLeft size={16} />
          Voltar para Usuários
        </button>

        <div className={styles.headerActions}>
          {mode === 'view' ? (
            <button className={styles.editBtn} onClick={() => { setMode('edit'); setSaveSuccess(''); setSaveError(''); }}>
              <Edit2 size={15} />
              Editar
            </button>
          ) : (
            <button className={styles.cancelBtn} onClick={handleCancelEdit}>
              <X size={15} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className={styles.panelBody}>
        <div className={styles.inner}>

          {/* Avatar + nome */}
          <div className={styles.heroCard}>
            <div className={styles.heroAvatar}>{getInitials(enriched.usu_nome)}</div>
            <div className={styles.heroInfo}>
              <h2 className={styles.heroName}>{enriched.usu_nome}</h2>
              <p className={styles.heroEmail}>{enriched.usu_email}</p>
              <div className={styles.heroBadges}>
                <span className={`${styles.badge} ${styles[`badge_${enriched.usu_status === 1 ? 'active' : 'inactive'}`]}`}>
                  {enriched.usu_status === 1 ? 'Ativo' : 'Inativo'}
                </span>
                <span className={`${styles.badge} ${styles[`badge_${verif.color}`]}`}>
                  {verif.label}
                </span>
                {enriched.type !== '—' && (
                  <span className={styles.badge}>{enriched.type}</span>
                )}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {saveSuccess && (
            <div className={styles.alertSuccess}><CheckCircle size={15} /> {saveSuccess}</div>
          )}
          {saveError && (
            <div className={styles.alertError}><AlertCircle size={15} /> {saveError}</div>
          )}

          {/* Modo visualização */}
          {mode === 'view' && (
            <div className={styles.grid}>
              <InfoCard icon={User} label="Nome completo" value={enriched.usu_nome} />
              <InfoCard icon={Mail} label="E-mail" value={enriched.usu_email} />
              <InfoCard
                icon={Phone}
                label="Telefone"
                value={enriched.usu_telefone ? enriched.usu_telefone : '—'}
              />
              <InfoCard icon={Building2} label="Instituição" value={enriched.school} />
              <InfoCard icon={BookOpen} label="Curso" value={enriched.course} />
              <InfoCard
                icon={ShieldCheck}
                label="Verificação"
                value={verif.label}
                valueColor={verif.color}
              />
              <InfoCard
                icon={Clock}
                label="Último acesso"
                value={formatDate(enriched.lastAccess)}
              />
              <InfoCard
                icon={Monitor}
                label="IP do último login"
                value={enriched.ipLogin ?? '—'}
                mono
              />
            </div>
          )}

          {/* Modo edição */}
          {mode === 'edit' && (
            <form className={styles.editForm} onSubmit={handleSave}>
              <div className={styles.editGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <User size={14} /> Nome completo
                  </label>
                  <input
                    name="usu_nome"
                    className={styles.input}
                    value={form.usu_nome}
                    onChange={handleFormChange}
                    placeholder="Nome completo"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Mail size={14} /> E-mail
                  </label>
                  <input
                    className={styles.input}
                    value={enriched.usu_email}
                    disabled
                    title="O e-mail não pode ser alterado"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Phone size={14} /> Telefone
                  </label>
                  <input
                    name="usu_telefone"
                    className={styles.input}
                    value={form.usu_telefone}
                    onChange={handleFormChange}
                    placeholder="(11) 99999-0000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <ShieldCheck size={14} /> Status da conta
                  </label>
                  <select
                    name="usu_status"
                    className={styles.input}
                    value={form.usu_status}
                    onChange={handleFormChange}
                  >
                    <option value={1}>Ativo</option>
                    <option value={0}>Inativo</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Building2 size={14} /> Instituição
                  </label>
                  <input className={styles.input} value={enriched.school} disabled />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <BookOpen size={14} /> Curso
                  </label>
                  <input className={styles.input} value={enriched.course} disabled />
                </div>
              </div>

              <p className={styles.editNote}>
                Campos desabilitados são gerenciados pelo próprio usuário ou pela instituição.
              </p>

              <div className={styles.editActions}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving
                    ? <><Loader2 size={15} className={styles.spin} /> Salvando...</>
                    : <><Save size={15} /> Salvar alterações</>}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, valueColor, mono }) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoLabel}>
        <Icon size={13} />
        {label}
      </div>
      <p className={`${styles.infoValue} ${valueColor ? styles[`color_${valueColor}`] : ''} ${mono ? styles.mono : ''}`}>
        {value}
      </p>
    </div>
  );
}
