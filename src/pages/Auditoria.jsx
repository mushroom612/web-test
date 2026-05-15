import { useState, useEffect } from 'react';
import { Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import styles from './Auditoria.module.css';

const PAGE_SIZE = 20;

const ACTION_LABELS = {
  CADASTRO_USU: 'Cadastro de Usuário',
  CRIAR_CARONA: 'Criação de Carona',
  PENALIDADE_SUSPENSAO: 'Suspensão por Penalidade',
  PENALIDADE_APLICAR: 'Aplicação de Penalidade',
  DELETAR_USU: 'Exclusão de Usuário',
  STATUS_USU: 'Alteração de Status',
  REMOVER_PENALIDADE: 'Remoção de Penalidade',
  RESTAURAR_CARONA: 'Restauração de Carona',
};

function formatAction(acao = '') {
  return ACTION_LABELS[acao.toUpperCase()] ?? acao;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

function getActionVariant(acao = '') {
  const upper = acao.toUpperCase();
  if (/SUSPENSAO|DELETAR|REMOVER/.test(upper)) return 'danger';
  if (/PENALIDADE|STATUS/.test(upper)) return 'warning';
  if (/CADASTRO|CRIAR|RESTAURAR/.test(upper)) return 'success';
  return 'info';
}

export function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [filterAcao, setFilterAcao] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ acao: '', dataInicio: '', dataFim: '' });

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getLogs({
        page,
        limit: PAGE_SIZE,
        acao: appliedFilters.acao || undefined,
        dataInicio: appliedFilters.dataInicio || undefined,
        dataFim: appliedFilters.dataFim || undefined,
      })
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.totalGeral ?? data.total ?? 0);
      })
      .catch((err) => {
        const msg = err.message ?? '';
        if (msg.includes('403') || msg.toLowerCase().includes('não autorizado')) {
          setError('O log de auditoria é restrito a desenvolvedores (role 2).');
        } else {
          setError('Não foi possível carregar os logs. Tente novamente.');
        }
      })
      .finally(() => setLoading(false));
  }, [page, appliedFilters]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ acao: filterAcao, dataInicio: filterDataInicio, dataFim: filterDataFim });
  }

  function handleFilterReset() {
    setFilterAcao('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setPage(1);
    setAppliedFilters({ acao: '', dataInicio: '', dataFim: '' });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await api.exportLogs();
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Auditoria</h1>
          <p className={styles.subtitle}>
            Registro de ações realizadas por administradores — visível somente para desenvolvedores
          </p>
        </div>
        <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
          {exporting
            ? <Loader2 size={16} className={styles.spinIcon} />
            : <Download size={16} />}
          Exportar CSV
        </button>
      </div>

      <form className={styles.filters} onSubmit={handleFilterSubmit}>
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Filtrar por ação..."
          value={filterAcao}
          onChange={(e) => setFilterAcao(e.target.value)}
        />
        <input
          className={styles.filterInput}
          type="date"
          value={filterDataInicio}
          onChange={(e) => setFilterDataInicio(e.target.value)}
          title="Data início"
        />
        <input
          className={styles.filterInput}
          type="date"
          value={filterDataFim}
          onChange={(e) => setFilterDataFim(e.target.value)}
          title="Data fim"
        />
        <button className={styles.filterBtn} type="submit">Filtrar</button>
        <button className={styles.filterBtnGhost} type="button" onClick={handleFilterReset}>
          Limpar
        </button>
      </form>

      {loading && (
        <div className={styles.loadingWrapper}>
          <Loader2 size={28} className={styles.spinIcon} />
          <span>Carregando logs...</span>
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Admin (ID)</th>
                  <th>Ação</th>
                  <th>Registro ID</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.audit_id ?? index} className={index % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.cellDateTime}>{formatDate(log.criado_em)}</td>
                    <td className={styles.cellAdmin}>{log.usu_id ?? '—'}</td>
                    <td>
                      <span className={`${styles.actionBadge} ${styles[`badge_${getActionVariant(log.acao)}`]}`}>
                        {formatAction(log.acao)}
                      </span>
                    </td>
                    <td className={styles.cellRegistro}>{log.registro_id ?? '—'}</td>
                    <td className={styles.cellIP}>
                      <code className={styles.ipCode}>{log.ip || '—'}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className={styles.emptyMsg}>Nenhum registro encontrado.</p>
            )}
          </div>

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {page} de {totalPages} · {total} registro{total !== 1 ? 's' : ''}
            </span>
            <div className={styles.paginationControls}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
