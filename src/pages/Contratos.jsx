// ============================================================
// pages/Contratos.jsx — Página de gestão de contratos institucionais
//
// Exibe os contratos das instituições cadastradas na plataforma.
//
// RBAC:
//   Admin (per_tipo=1) → GET /api/admin/contrato
//     Retorna apenas o contrato da própria escola.
//   Dev (per_tipo=2)   → GET /api/dev/escolas
//     Retorna todas as escolas com dados de contrato.
//
// Funcionalidades:
//   - Busca por nome, domínio ou endereço
//   - Filtros por status: Todos / Ativo / Vencido / Pendente de Assinatura
//   - Card por contrato: datas, duração, domínio, dias restantes
//   - Botão "Renovar" (Dev only, contratos Vencidos):
//       Exibe seletor inline de duração + botão de confirmar
//       Chama POST /api/dev/escolas/:id/contrato após confirmação
//   - Botões "Visualizar" e "Download" desabilitados (sem arquivo ainda)
//
// Estilo: Contratos.module.css
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { BASE_URL } from '../services/http';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconEye, IconDownload, IconRotateClockwise, IconFileText,
  IconSearch, IconX, IconLoader2, IconBuilding,
  IconUserPlus, IconChevronDown, IconChevronUp, IconCircleCheck, IconPlus
} from '@tabler/icons-react';
import styles from './Contratos.module.css';

const DURATION_LABEL = {
  '1ano':  '1 Ano',
  '2anos': '2 Anos',
  '5anos': '5 Anos'
};

const DURATION_OPTIONS = [
  { value: '1ano',  label: '1 Ano'  },
  { value: '2anos', label: '2 Anos' },
  { value: '5anos', label: '5 Anos' }
];

// parseLocalDate: converte 'AAAA-MM-DD' (ou ISO completo) para Date local.
// Fatiamos os primeiros 10 caracteres para aceitar tanto 'YYYY-MM-DD'
// quanto 'YYYY-MM-DDT...' sem deslocamento de fuso UTC.
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// getContractStatus: determina o status atual do contrato.
// Usa status_contrato da API quando disponível; caso contrário calcula localmente.
function getContractStatus(school) {
  // status_contrato vem do backend com valores 'sem_contrato'|'expirado'|'vencendo'|'ativo'
  // Traduzimos para os rótulos da UI ('Pendente de Assinatura'|'Vencido'|'Ativo')
  if (school.status_contrato) {
    if (school.status_contrato === 'ativo' || school.status_contrato === 'vencendo') return 'Ativo';
    if (school.status_contrato === 'expirado') return 'Vencido';
    return 'Pendente de Assinatura';
  }

  // Fallback: cálculo local por datas (para respostas sem status_contrato)
  const inicio = parseLocalDate(school.esc_contrato_inicio);
  const expira = parseLocalDate(school.esc_contrato_expira);
  if (!inicio || !expira) return 'Pendente de Assinatura';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inicio > today) return 'Pendente de Assinatura';
  if (expira < today) return 'Vencido';
  return 'Ativo';
}

export function Contratos() {
  const { isAdmin, isDev } = useAuth();

  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchText, setSearchText]     = useState('');
  const [schools, setSchools]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // renewState: { escId, duracao } quando o seletor inline está aberto; null = fechado
  const [renewState, setRenewState]     = useState(null);
  const [renewLoading, setRenewLoading] = useState(false);

  // adminsByEsc: { [esc_id]: adminUser[] } — admins de cada escola
  const [adminsByEsc, setAdminsByEsc]       = useState({});
  // expandedAdminEsc: esc_id da escola com seção de admins aberta
  const [expandedAdminEsc, setExpandedAdminEsc] = useState(null);
  // adminFormEsc: esc_id com formulário de novo admin aberto
  const [adminFormEsc, setAdminFormEsc]     = useState(null);
  const [adminForm, setAdminForm]           = useState({ usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: '' });
  const [adminSaving, setAdminSaving]       = useState(false);
  const [adminError, setAdminError]         = useState('');

  // loadContracts: busca os dados conforme o papel do usuário.
  // Admin → GET /api/admin/contrato (1 escola, a própria)
  // Dev   → GET /api/dev/escolas    (todas as escolas com dados de contrato)
  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let lista;
      if (isAdmin) {
        const data = await api.getMyContract();
        // getMyContract retorna { contrato: {...} } — normalizamos para array
        const c = data?.contrato;
        lista = c ? [c] : [];
      } else {
        const data = await api.getSchools();
        lista = data?.escolas ?? (Array.isArray(data) ? data : []);
      }
      setSchools(lista);

      if (lista.length > 0) {
        try {
          const results = await Promise.all(
            lista.map(s => api.getUsers({ esc_id: s.esc_id, limit: 50 }).catch(() => null))
          );
          const map = {};
          lista.forEach((s, i) => {
            const users = results[i]?.usuarios ?? [];
            map[s.esc_id] = users.filter(u => u.per_tipo === 1);
          });
          setAdminsByEsc(map);
        } catch { /* admins são opcionais — não bloquear a página */ }
      }
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os contratos.');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  // handleRenewConfirm: renova o contrato via POST /api/dev/escolas/:id/contrato.
  // A data de início é definida como hoje automaticamente.
  async function handleRenewConfirm(escId) {
    if (!renewState?.duracao || renewLoading) return;  // guard contra duplo-clique
    setRenewLoading(true);
    try {
      await api.createContract(escId, {
        duracao: renewState.duracao,
        data_inicio: new Date().toISOString().slice(0, 10)
      });
      setRenewState(null);
      await loadContracts();
    } catch (err) {
      alert(err.message || 'Erro ao renovar contrato.');
    } finally {
      setRenewLoading(false);
    }
  }

  // downloadingId: ID da escola cujo download está em andamento (spinner individual)
  const [downloadingId, setDownloadingId] = useState(null);

  // getFileUrl: constrói a URL pública do arquivo a partir do caminho relativo.
  // A API serve /public como estático: GET /public/contratos/arquivo.pdf
  // esc_contrato_arquivo armazena 'contratos/timestamp-random.pdf'
  function getFileUrl(arquivo) {
    return `${BASE_URL}/public/${arquivo}`;
  }

  // getArquivo: retorna o caminho do arquivo de contrato, aceitando ambos os nomes de campo.
  function getArquivo(school) {
    return school.esc_contrato_arquivo || school.contrato_arquivo || null;
  }

  // handleView: abre o PDF do contrato numa nova aba do browser.
  function handleView(arquivo) {
    window.open(getFileUrl(arquivo), '_blank', 'noopener,noreferrer');
  }

  // handleDownload: faz o download do PDF como arquivo.
  // Usa fetch → blob → URL de objeto → <a download> para forçar o download
  // em vez de abrir no browser (comportamento padrão para PDFs).
  async function handleDownload(arquivo, escNome, escId) {
    setDownloadingId(escId);
    try {
      const res = await fetch(getFileUrl(arquivo));
      if (!res.ok) throw new Error(`Erro ${res.status} ao buscar o arquivo.`);
      const blob   = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = objUrl;
      a.download   = `contrato-${(escNome || 'escola').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      alert('Não foi possível baixar o arquivo: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  function handleToggleAdminSection(escId) {
    if (expandedAdminEsc === escId) {
      setExpandedAdminEsc(null);
      setAdminFormEsc(null);
      setAdminError('');
      return;
    }
    setExpandedAdminEsc(escId);
    setAdminFormEsc(null);
    setAdminError('');
  }

  async function handleSaveAdmin(escId) {
    if (!adminForm.usu_nome.trim() || !adminForm.usu_email.trim() || !adminForm.usu_senha.trim()) {
      setAdminError('Preencha os campos obrigatórios.');
      return;
    }
    if (adminForm.usu_senha !== adminForm.usu_confirmSenha) {
      setAdminError('As senhas não coincidem.');
      return;
    }
    setAdminSaving(true);
    setAdminError('');
    try {
      const res = await api.createUser({
        usu_nome:      adminForm.usu_nome.trim(),
        usu_email:     adminForm.usu_email.trim(),
        usu_senha:     adminForm.usu_senha,
        usu_telefone:  adminForm.usu_telefone || undefined,
        per_tipo:      1,
        per_escola_id: escId,
      });
      const novo = res?.usuario ?? res;
      setAdminsByEsc(prev => ({ ...prev, [escId]: [...(prev[escId] || []), { ...novo, per_habilitado: 1 }] }));
      setAdminFormEsc(null);
      setAdminForm({ usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: '' });
    } catch (err) {
      setAdminError(err.message || 'Erro ao cadastrar administrador.');
    } finally {
      setAdminSaving(false);
    }
  }

  async function handleToggleAdminHabilitado(escId, adm) {
    const novoEstado = adm.per_habilitado ? 0 : 1;
    try {
      await api.updateUserProfile(adm.usu_id, { per_habilitado: novoEstado });
      setAdminsByEsc(prev => ({
        ...prev,
        [escId]: prev[escId].map(a =>
          a.usu_id === adm.usu_id ? { ...a, per_habilitado: novoEstado } : a
        ),
      }));
    } catch (err) {
      alert(err.message || 'Erro ao alterar status do administrador.');
    }
  }

  // contractSchools: apenas escolas que já têm contrato cadastrado
  const contractSchools = schools.filter(s => s.esc_contrato_duracao);

  const filteredContracts = contractSchools.filter((school) => {
    const status     = getContractStatus(school);
    const matchStatus = filterStatus === 'Todos' || status === filterStatus;
    const q           = searchText.toLowerCase();
    const matchSearch = !q ||
      (school.esc_nome    && school.esc_nome.toLowerCase().includes(q))    ||
      (school.esc_dominio && school.esc_dominio.toLowerCase().includes(q)) ||
      (school.esc_endereco && school.esc_endereco.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const statuses = ['Todos', 'Ativo', 'Vencido', 'Pendente de Assinatura'];

  return (
    <div className={styles.container}>
      {/* Busca e filtros: só fazem sentido para Dev (múltiplas escolas) */}
      {isDev && (
        <>
          <div className={styles.searchWrapper}>
            <IconSearch size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar por instituição, domínio ou endereço..."
              className={styles.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearchText('')}
                title="Limpar pesquisa"
              >
                <IconX size={16} />
              </button>
            )}
          </div>

          <div className={styles.filterTabs}>
            {statuses.map((status) => (
              <button
                key={status}
                className={`${styles.filterBtn} ${filterStatus === status ? styles.active : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Conteúdo principal */}
      {loading ? (
        <div className={styles.noResults}>
          <IconLoader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} />
          <p>Carregando contratos...</p>
        </div>
      ) : error ? (
        <div className={styles.noResults}>
          <IconFileText size={48} />
          <p style={{ color: 'var(--color-semantic-error, #dc2626)' }}>{error}</p>
          <button
            onClick={loadContracts}
            style={{
              marginTop: 8, padding: '6px 16px', border: 'none',
              borderRadius: 6, background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)', cursor: 'pointer', fontWeight: 600
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className={styles.noResults}>
          <IconFileText size={48} />
          <p>
            {contractSchools.length === 0
              ? 'Nenhum contrato cadastrado.'
              : 'Nenhum contrato encontrado com este filtro.'}
          </p>
        </div>
      ) : (
        <div className={styles.contractsList}>
          {filteredContracts.map((school) => {
            const status          = getContractStatus(school);
            const isRenewing      = renewState?.escId === school.esc_id;
            const hasFile         = !!(school.esc_contrato_arquivo || school.contrato_arquivo);

            const isDownloading = downloadingId === school.esc_id;

            return (
              <div key={school.esc_id} className={styles.contractCard}>
                {/* Cabeçalho: nome + badge */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3 className={styles.institutionName}>{school.esc_nome}</h3>
                    <p className={styles.contractType}>
                      Contrato de {DURATION_LABEL[school.esc_contrato_duracao] ?? school.esc_contrato_duracao}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {school.esc_endereco && (
                  <p className={styles.description}>{school.esc_endereco}</p>
                )}

                {/* Grade de informações */}
                <div className={styles.cardInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Início</span>
                    <span className={styles.infoValue}>
                      {school.esc_contrato_inicio
                        ? parseLocalDate(school.esc_contrato_inicio).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Vencimento</span>
                    <span className={styles.infoValue}>
                      {school.esc_contrato_expira
                        ? parseLocalDate(school.esc_contrato_expira).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Duração</span>
                    <span className={styles.infoValue}>
                      {DURATION_LABEL[school.esc_contrato_duracao] ?? '—'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Domínio</span>
                    <span className={styles.infoValue}>
                      {school.esc_dominio || 'Sem restrição'}
                    </span>
                  </div>
                  {/* dias_restantes: campo extra retornado pela API */}
                  {school.dias_restantes != null && status === 'Ativo' && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Dias restantes</span>
                      <span className={styles.infoValue}>{school.dias_restantes} dias</span>
                    </div>
                  )}
                </div>

                {/* ── Seção de Administradores ── */}
                {(() => {
                  const escId          = school.esc_id;
                  const admins         = adminsByEsc[escId] || [];
                  const isAdmExpanded  = expandedAdminEsc === escId;
                  const showAdminForm  = adminFormEsc === escId;
                  const firstAdm       = admins[0];

                  return (
                    <>
                      <button
                        className={styles.admToggleBtn}
                        onClick={() => handleToggleAdminSection(escId)}
                      >
                        <IconUserPlus size={13} />
                        <span>
                          {admins.length > 0
                            ? `${admins.length} Administrador${admins.length > 1 ? 'es' : ''}`
                            : 'Administradores'}
                          {!isAdmExpanded && firstAdm && ` — ${firstAdm.usu_nome}`}
                        </span>
                        {isAdmExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                      </button>

                      {isAdmExpanded && (
                        <div className={styles.admSection}>
                          {admins.length === 0 && !showAdminForm && (
                            <p className={styles.admEmpty}>Nenhum administrador cadastrado.</p>
                          )}

                          {admins.map(adm => (
                            <div key={adm.usu_id} className={styles.admItem}>
                              <div className={styles.admInfo}>
                                <span className={styles.admName}>{adm.usu_nome}</span>
                                <span className={styles.admEmail}>{adm.usu_email}</span>
                              </div>
                              <div className={styles.admActions}>
                                <span className={adm.per_habilitado ? styles.admBadgeActive : styles.admBadgeInactive}>
                                  {adm.per_habilitado ? 'Ativo' : 'Inativo'}
                                </span>
                                {isDev && (
                                  <button
                                    className={adm.per_habilitado ? styles.admDeactivateBtn : styles.admActivateBtn}
                                    onClick={() => handleToggleAdminHabilitado(escId, adm)}
                                    title={adm.per_habilitado ? 'Desativar acesso' : 'Reativar acesso'}
                                  >
                                    {adm.per_habilitado ? 'Desativar' : 'Reativar'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {isDev && showAdminForm && (
                            <div className={styles.admForm}>
                              <div className={styles.admFormGrid}>
                                <input type="text" placeholder="Nome completo *" className={styles.admInput}
                                  value={adminForm.usu_nome}
                                  onChange={e => setAdminForm(p => ({ ...p, usu_nome: e.target.value }))} />
                                <input type="email" placeholder="E-mail *" className={styles.admInput}
                                  value={adminForm.usu_email}
                                  onChange={e => setAdminForm(p => ({ ...p, usu_email: e.target.value }))} />
                                <input type="text" placeholder="Telefone" className={styles.admInput}
                                  value={adminForm.usu_telefone}
                                  onChange={e => setAdminForm(p => ({ ...p, usu_telefone: e.target.value }))} />
                                <div />
                                <input type="password" placeholder="Senha *" className={styles.admInput}
                                  value={adminForm.usu_senha}
                                  onChange={e => setAdminForm(p => ({ ...p, usu_senha: e.target.value }))} />
                                <input type="password" placeholder="Confirmar senha *" className={styles.admInput}
                                  value={adminForm.usu_confirmSenha}
                                  onChange={e => setAdminForm(p => ({ ...p, usu_confirmSenha: e.target.value }))} />
                              </div>
                              {adminError && <p className={styles.admError}>{adminError}</p>}
                              <div className={styles.admFormActions}>
                                <button className={styles.admSaveBtn} disabled={adminSaving}
                                  onClick={() => handleSaveAdmin(escId)}>
                                  {adminSaving ? <IconLoader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <IconCircleCheck size={13} />}
                                  Adicionar
                                </button>
                                <button className={styles.admCancelBtn}
                                  onClick={() => { setAdminFormEsc(null); setAdminError(''); }}>
                                  <IconX size={13} /> Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {isDev && !showAdminForm && (
                            <button className={styles.admAddBtn}
                              onClick={() => { setAdminFormEsc(escId); setAdminForm({ usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: '' }); setAdminError(''); }}>
                              <IconPlus size={13} /> Adicionar Administrador
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── Formulário inline de renovação (Dev only, contratos Vencidos) ── */}
                {isDev && status === 'Vencido' && isRenewing && (
                  <div className={styles.renewForm}>
                    <span className={styles.renewFormLabel}>Nova duração:</span>
                    <select
                      className={styles.renewSelect}
                      value={renewState.duracao}
                      onChange={e => setRenewState(prev => ({ ...prev, duracao: e.target.value }))}
                      disabled={renewLoading}
                    >
                      <option value="">Selecione...</option>
                      {DURATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      className={styles.renewConfirmBtn}
                      onClick={() => handleRenewConfirm(school.esc_id)}
                      disabled={!renewState.duracao || renewLoading}
                    >
                      {renewLoading
                        ? <><IconLoader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Renovando...</>
                        : 'Confirmar'}
                    </button>
                    <button
                      className={styles.renewCancelBtn}
                      onClick={() => setRenewState(null)}
                      disabled={renewLoading}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* ── Botões de ação ── */}
                <div className={styles.cardActions}>
                  {/* Visualizar: abre o PDF numa nova aba */}
                  <button
                    className={styles.actionBtn}
                    disabled={!hasFile}
                    title={hasFile ? 'Abrir PDF em nova aba' : 'Nenhum arquivo de contrato enviado'}
                    onClick={() => hasFile && handleView(getArquivo(school))}
                  >
                    <IconEye size={16} />
                    Visualizar
                  </button>

                  {/* Renovar: só para Dev em contratos Vencidos */}
                  {isDev && status === 'Vencido' && !isRenewing && (
                    <button
                      className={styles.renewBtn}
                      onClick={() => setRenewState({ escId: school.esc_id, duracao: '' })}
                    >
                      <IconRotateClockwise size={16} />
                      Renovar
                    </button>
                  )}

                  {/* Download: baixa o PDF como arquivo */}
                  <button
                    className={styles.downloadBtn}
                    disabled={!hasFile || isDownloading}
                    title={hasFile ? 'Baixar PDF do contrato' : 'Nenhum arquivo de contrato enviado'}
                    onClick={() => hasFile && !isDownloading && handleDownload(
                      getArquivo(school), school.esc_nome, school.esc_id
                    )}
                  >
                    {isDownloading
                      ? <><IconLoader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Baixando...</>
                      : <><IconDownload size={16} /> Download</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
