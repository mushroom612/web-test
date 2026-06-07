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
  Eye, Download, RotateCw, FileText,
  Search, X, Loader2, Building2
} from 'lucide-react';
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
      <div className={styles.header}>
        <h1 className={styles.title}>Contratos Institucionais</h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? 'Visualize o contrato da sua instituição com a plataforma TucTuc'
            : 'Contratos de todas as instituições parceiras da plataforma TucTuc'}
        </p>
      </div>

      {/* Busca e filtros: só fazem sentido para Dev (múltiplas escolas) */}
      {isDev && (
        <>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
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
                <X size={16} />
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
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} />
          <p>Carregando contratos...</p>
        </div>
      ) : error ? (
        <div className={styles.noResults}>
          <FileText size={48} />
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
          <FileText size={48} />
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
            const hasFile         = !!school.esc_contrato_arquivo; // sem arquivo ainda

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
                        ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Renovando...</>
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
                    title={hasFile ? 'Abrir PDF em nova aba' : 'Nenhum arquivo enviado ainda'}
                    onClick={() => hasFile && handleView(school.esc_contrato_arquivo)}
                  >
                    <Eye size={16} />
                    Visualizar
                  </button>

                  {/* Renovar: só para Dev em contratos Vencidos */}
                  {isDev && status === 'Vencido' && !isRenewing && (
                    <button
                      className={styles.renewBtn}
                      onClick={() => setRenewState({ escId: school.esc_id, duracao: '' })}
                    >
                      <RotateCw size={16} />
                      Renovar
                    </button>
                  )}

                  {/* Download: baixa o PDF como arquivo */}
                  <button
                    className={styles.downloadBtn}
                    disabled={!hasFile || isDownloading}
                    title={hasFile ? 'Baixar PDF do contrato' : 'Nenhum arquivo enviado ainda'}
                    onClick={() => hasFile && !isDownloading && handleDownload(
                      school.esc_contrato_arquivo, school.esc_nome, school.esc_id
                    )}
                  >
                    {isDownloading
                      ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Baixando...</>
                      : <><Download size={16} /> Download</>}
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
