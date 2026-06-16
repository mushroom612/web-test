// ============================================================
// pages/Auditoria.jsx — Visualizador de logs de auditoria
//
// Exibe um histórico de ações realizadas na plataforma separando
// ações do painel administrativo (Admin/Dev) das ações do app
// mobile (usuários comuns).
//
// Abas:
//   "Painel Admin/Dev" → ações de moderação, login, penalidades,
//     escolas, contratos, denúncias. Colunas: Administrador + Escola.
//   "App — Usuários"   → ações de carona e solicitação feitas pelo
//     app mobile. Coluna: Usuário.
//
// A separação é feita client-side com base no conjunto APP_ACOES:
//   ações CARONA_* e SOLICITACAO_* pertencem ao App;
//   todas as demais pertencem ao Painel.
//
// Funcionalidades:
//   - Filtros: tipo de ação, data de início e data de fim
//   - Filtros só são aplicados ao clicar "Filtrar" (não em tempo real)
//   - Badges coloridos por categoria de ação (danger/warning/success/info)
//   - Exportação dos logs filtrados pela aba ativa como PDF
//   - Exportação de todos os logs como CSV
//
// Paginação: server-side (20 por página). A filtragem por aba é
// aplicada sobre a página atual, então o número de linhas visíveis
// pode variar entre abas para a mesma página.
//
// Bibliotecas usadas:
//   - react              → useState, useEffect
//   - @tabler/icons-react → ícones
//   - jspdf + jspdf-autotable → exportação PDF (importação lazy)
//
// Dados consumidos:
//   - api.getLogs({ page, limit, acao, dataInicio, dataFim })
//   - api.exportLogs() → CSV com todos os logs
//
// Estilo: Auditoria.module.css
// ============================================================

import { useState, useEffect } from 'react';
import {
  IconLoader2, IconDownload, IconFileTypePdf,
  IconLayoutDashboard, IconDeviceMobile
} from '@tabler/icons-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination } from '../components/Pagination';
import styles from './Auditoria.module.css';

// PAGE_SIZE: registros por página (alinhado com o backend).
const PAGE_SIZE = 20;

const TABELA_LABELS = {
  USUARIOS:    'Usuário',
  CARONAS:     'Carona',
  PENALIDADES: 'Penalidade',
  ESCOLAS:     'Escola',
  CONTRATOS:   'Contrato',
  CURSOS:      'Curso',
  DENUNCIAS:   'Denúncia',
  SUGESTOES:   'Sugestão',
};

const ACAO_LABELS = {
  // Caronas
  CARONA_CRIAR:          'Criação de Carona',
  CARONA_CANCELAR:       'Cancelamento de Carona',
  CARONA_FINALIZAR:      'Finalização de Carona',
  CARONA_ATUALIZAR:      'Atualização de Carona',
  // Solicitações
  SOLICITACAO_ACEITAR:   'Aceitação de Solicitação',
  SOLICITACAO_REJEITAR:  'Rejeição de Solicitação',
  SOLICITACAO_CRIAR:     'Nova Solicitação',
  SOLICITACAO_CANCELAR:  'Cancelamento de Solicitação',
  // Usuários
  USUARIO_CRIAR:         'Cadastro de Usuário',
  USUARIO_ATIVAR:        'Ativação de Usuário',
  USUARIO_INATIVAR:      'Inativação de Usuário',
  USUARIO_SUSPENDER:     'Suspensão de Usuário',
  USUARIO_RESTAURAR:     'Restauração de Usuário',
  USUARIO_ATUALIZAR:     'Atualização de Usuário',
  // Penalidades
  PENALIDADE_APLICAR:    'Aplicação de Penalidade',
  PENALIDADE_REMOVER:    'Remoção de Penalidade',
  PENALIDADE_CRIAR:      'Criação de Penalidade',
  // Autenticação
  LOGIN:                 'Login',
  LOGIN_FALHA:           'Login Falhado',
  LOGIN_FALHADO:         'Login Falhado',
  LOGOUT:                'Logout',
  SENHA_REDEFINIR:       'Redefinição de Senha',
  SENHA_ALTERAR:         'Alteração de Senha',
  // Escolas / Contratos
  ESCOLA_CRIAR:          'Cadastro de Escola',
  ESCOLA_ATUALIZAR:      'Atualização de Escola',
  CONTRATO_CRIAR:        'Criação de Contrato',
  CONTRATO_RENOVAR:      'Renovação de Contrato',
  // Sugestões / Denúncias
  SUGESTAO_RESPONDER:    'Resposta a Sugestão',
  SUGESTAO_ARQUIVAR:     'Arquivamento de Sugestão',
  DENUNCIA_RESPONDER:    'Resposta a Denúncia',
  DENUNCIA_ARQUIVAR:     'Arquivamento de Denúncia',
};

// APP_ACOES: conjunto de ações originadas do app mobile.
// Tudo que não está neste set é considerado ação do painel admin.
const APP_ACOES = new Set([
  'CARONA_CRIAR', 'CARONA_CANCELAR', 'CARONA_FINALIZAR', 'CARONA_ATUALIZAR',
  'SOLICITACAO_ACEITAR', 'SOLICITACAO_REJEITAR', 'SOLICITACAO_CRIAR', 'SOLICITACAO_CANCELAR',
]);

function isAppAction(acao = '') {
  return APP_ACOES.has(acao.toUpperCase());
}

function translateAcao(acao = '') {
  return ACAO_LABELS[acao] ?? ACAO_LABELS[acao.toUpperCase()] ?? acao;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// Retorna o sufixo da classe global "badge-{variant}" do global.css
function getActionVariant(acao = '') {
  const lower = translateAcao(acao).toLowerCase();
  if (/suspensão|exclusão|remoção|falhado|rejeição|cancelamento|inativação/.test(lower)) return 'error';
  if (/penalidade|status|bloqueio|atualização|alteração/.test(lower)) return 'warning';
  if (/cadastro|criação|restauração|ativação|aceitação|nova solicitação/.test(lower)) return 'success';
  return 'info';
}

export function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // activeTab: 'painel' = Admin/Dev, 'app' = usuários do app mobile
  const [activeTab, setActiveTab] = useState('painel');

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

  // handleTabChange: muda a aba ativa e volta para a primeira página.
  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await api.exportLogs();
    } finally {
      setExporting(false);
    }
  }

  // handleExportPdf: exporta apenas os registros da aba ativa.
  async function handleExportPdf() {
    const tabLogs = logs.filter(log =>
      activeTab === 'app' ? isAppAction(log.acao) : !isAppAction(log.acao)
    );
    if (tabLogs.length === 0) return;
    setExportingPdf(true);
    try {
      const hoje = new Date();
      const hojeFormatado = hoje.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const tabLabel = activeTab === 'app' ? 'App — Usuários' : 'Painel Admin/Dev';

      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, pageW, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('TucTuc', 12, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Gerado em ${hojeFormatado}`, pageW - 12, 13, { align: 'right' });

      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Auditoria — Logs · ${tabLabel}`, 12, 31);

      const totalRows = tabLogs.length;
      const isApp = activeTab === 'app';

      autoTable(doc, {
        head: [isApp
          ? ['Data/Hora', 'Usuário', 'Ação', 'Registro']
          : ['Data/Hora', 'Administrador', 'Escola', 'Ação', 'Registro']
        ],
        body: tabLogs.map(log => isApp
          ? [
              formatDate(log.criado_em),
              log.usu_nome || (log.usu_id ? `Usuário #${log.usu_id}` : '—'),
              translateAcao(log.acao),
              log.alvo_nome || log.registro_nome || (log.registro_id != null ? `#${log.registro_id}` : '—')
            ]
          : [
              formatDate(log.criado_em),
              log.admin_nome ?? (log.usu_id ? `Admin #${log.usu_id}` : '—'),
              log.admin_escola ?? '—',
              translateAcao(log.acao),
              log.alvo_nome || log.registro_nome || (log.registro_id != null ? `#${log.registro_id}` : '—')
            ]
        ),
        startY: 36,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 246] },
        didDrawPage: (hookData) => {
          const pageCount = doc.internal.getNumberOfPages();
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(7);
          doc.setTextColor(130);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total: ${totalRows} registro${totalRows !== 1 ? 's' : ''}`, 12, pageH - 6);
          doc.text(`Página ${hookData.pageNumber} de ${pageCount}`, pageW - 12, pageH - 6, { align: 'right' });
        }
      });
      doc.save(`auditoria-${activeTab}-p${page}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Filtragem client-side: separa os logs da página atual por origem.
  const visibleLogs = logs.filter(log =>
    activeTab === 'app' ? isAppAction(log.acao) : !isAppAction(log.acao)
  );
  const painelCount = logs.filter(log => !isAppAction(log.acao)).length;
  const appCount    = logs.filter(log =>  isAppAction(log.acao)).length;

  return (
    <div className={styles.container}>

      {/* ── Toolbar: filtros + botões de export ────────────────── */}
      <div className={styles.toolbar}>
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
          {(appliedFilters.acao || appliedFilters.dataInicio || appliedFilters.dataFim) && (
            <button className={styles.filterBtnGhost} type="button" onClick={handleFilterReset}>
              Limpar
            </button>
          )}
        </form>

        <div className={styles.exportBtnGroup}>
          <button
            className={styles.exportBtnSecondary}
            onClick={handleExportPdf}
            disabled={exportingPdf || visibleLogs.length === 0}
            title="Exportar PDF dos registros da aba ativa"
          >
            {exportingPdf
              ? <IconLoader2 size={16} className={styles.spinIcon} />
              : <IconFileTypePdf size={16} />}
            Exportar PDF
          </button>
          <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
            {exporting
              ? <IconLoader2 size={16} className={styles.spinIcon} />
              : <IconDownload size={16} />}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Abas de origem ─────────────────────────────────────── */}
      <div className={styles.tabsRow}>
        <div className="pill-group">
          <button
            className={`pill-btn ${activeTab === 'painel' ? 'pill-btn-active' : ''}`}
            onClick={() => handleTabChange('painel')}
          >
            <IconLayoutDashboard size={14} />
            Painel Admin/Dev
          </button>
          <button
            className={`pill-btn ${activeTab === 'app' ? 'pill-btn-active' : ''}`}
            onClick={() => handleTabChange('app')}
          >
            <IconDeviceMobile size={14} />
            App — Usuários
          </button>
        </div>
      </div>

      {/* ── Spinner de carregamento ─────────────────────────────── */}
      {loading && <LoadingSpinner size={28} text="Carregando logs..." />}

      {/* ── Caixa de erro ──────────────────────────────────────── */}
      {!loading && error && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {/* ── Tabela e paginação ─────────────────────────────────── */}
      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  {activeTab === 'painel' ? (
                    <>
                      <th>Administrador</th>
                      <th>Escola</th>
                    </>
                  ) : (
                    <th>Usuário</th>
                  )}
                  <th>Ação</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.map((log, index) => (
                  <tr
                    key={log.audit_id ?? index}
                    className={index % 2 === 0 ? styles.rowEven : ''}
                  >
                    <td className={styles.cellDateTime}>{formatDate(log.criado_em)}</td>

                    {activeTab === 'painel' ? (
                      <>
                        <td className={styles.cellAdmin}>
                          {log.admin_nome ?? (log.usu_id ? `Admin #${log.usu_id}` : '—')}
                        </td>
                        <td className={styles.cellEscola}>
                          {log.admin_escola ?? '—'}
                        </td>
                      </>
                    ) : (
                      <td className={styles.cellAdmin}>
                        {log.usu_nome || (log.usu_id ? `Usuário #${log.usu_id}` : '—')}
                      </td>
                    )}

                    <td>
                      <span className={`badge badge-${getActionVariant(log.acao)}`}>
                        {translateAcao(log.acao)}
                      </span>
                    </td>
                    <td className={styles.cellRegistro}>
                      {log.alvo_nome || log.registro_nome || (log.registro_id != null ? `#${log.registro_id}` : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleLogs.length === 0 && (
              <p className={styles.emptyMsg}>Nenhum registro encontrado nesta aba.</p>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="registro"
            onPrevious={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </>
      )}
    </div>
  );
}
