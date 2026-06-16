// ============================================================
// pages/Auditoria.jsx — Visualizador de logs de auditoria
//
// Exibe um histórico de ações realizadas por administradores
// na plataforma. Esta página é restrita a desenvolvedores (role 2).
//
// Funcionalidades:
//   - Tabela paginada de logs (20 registros por página — PAGE_SIZE)
//   - Filtros: tipo de ação, data de início e data de fim
//   - Filtros só são aplicados ao clicar "Filtrar" (não em tempo real)
//   - Badges coloridos por categoria de ação (danger/warning/success/info)
//   - Exportação dos logs como CSV
//   - Mensagem de erro amigável quando o acesso é negado (403)
//
// Como funciona a paginação:
//   - `page`: número da página atual (começa em 1)
//   - `total`: total de registros que correspondem ao filtro
//   - `totalPages`: total de páginas = Math.ceil(total / PAGE_SIZE)
//   - Ao mudar de página, o useEffect rebusca os dados da API com
//     os novos parâmetros `page` e os filtros ativos.
//
// Separação entre filtros digitados e filtros aplicados:
//   - `filterAcao`, `filterDataInicio`, `filterDataFim` → estados do input
//     (o que o usuário está digitando, mas ainda não aplicou)
//   - `appliedFilters` → filtros que realmente estão em vigor na consulta.
//   Isso evita que a lista recarregue a cada tecla digitada.
//
// Bibliotecas usadas:
//   - react              → useState, useEffect
//   - lucide-react       → Loader2, Download, ChevronLeft, ChevronRight
//
// Dados consumidos:
//   - api.getLogs({ page, limit, acao, dataInicio, dataFim })
//   - api.exportLogs() → baixa os logs como arquivo CSV
//
// Interligação:
//   - Importa: api.js
//
// Estilo: Auditoria.module.css
//   Classes CSS utilizadas:
//     .container         → área raiz da página
//     .header            → cabeçalho com título e botão "Exportar CSV"
//     .title             → texto "Auditoria"
//     .subtitle          → descrição abaixo do título
//     .exportBtn         → botão de exportação CSV (canto superior direito)
//     .filters           → formulário de filtros (linha horizontal)
//     .filterInput       → campo de texto/data para filtrar
//     .filterBtn         → botão "Filtrar" (submit do form)
//     .filterBtnGhost    → botão "Limpar" (estilo secundário)
//     .loadingWrapper    → centraliza o spinner durante o carregamento
//     .spinIcon          → aplica animação de rotação ao ícone Loader2
//     .errorBox          → caixa vermelha com mensagem de erro
//     .tableWrapper      → container com scroll horizontal da tabela
//     .table             → tabela HTML com as colunas de log
//     .rowEven           → fundo alternado para linhas pares (efeito zebrado)
//     .cellDateTime      → célula com data e hora (fonte menor)
//     .cellAdmin         → célula com ID do administrador
//     .actionBadge       → badge colorido com a ação (span)
//     .badge_danger      → vermelho (suspensão, exclusão, remoção)
//     .badge_warning     → amarelo (penalidade, alteração de status)
//     .badge_success     → verde (cadastro, criação, restauração)
//     .badge_info        → azul (ação genérica)
//     .cellRegistro      → célula com o ID do registro afetado
//     .cellIP            → célula com o IP do administrador
//     .ipCode            → texto de IP com fonte monospace
//     .emptyMsg          → mensagem quando não há registros
//     .pagination        → rodapé com informações e controles de página
//     .paginationInfo    → texto "Página X de Y · Z registros"
//     .paginationControls → agrupa os botões de navegação
//     .pageBtn           → botão "Anterior" / "Próximo"
// ============================================================

import { useState, useEffect } from 'react';
import { IconLoader2, IconDownload, IconFileTypePdf } from '@tabler/icons-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination } from '../components/Pagination';
import styles from './Auditoria.module.css';

// PAGE_SIZE: quantidade de registros por página.
// Valor fixo definido como constante para facilitar a mudança futura.
const PAGE_SIZE = 20;

// TABELA_LABELS: converte o nome da tabela no banco para um label legível.
// Usado na coluna "Registro" para exibir ex: "Usuário #5" em vez de "5".
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

// ACAO_LABELS: traduz códigos crus enviados pelo backend (SNAKE_CASE) para português.
// Ações já traduzidas pelo backend passam direto sem modificação.
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

// translateAcao: retorna a ação traduzida se for um código cru,
// ou o valor original caso o backend já tenha enviado texto legível.
function translateAcao(acao = '') {
  return ACAO_LABELS[acao] ?? ACAO_LABELS[acao.toUpperCase()] ?? acao;
}

// formatDate: converte uma string de data/hora para o padrão brasileiro sem segundos.
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

// getActionVariant: classifica uma ação em uma categoria de cor.
// Aceita tanto texto traduzido quanto códigos crus.
function getActionVariant(acao = '') {
  const lower = translateAcao(acao).toLowerCase();
  if (/suspensão|exclusão|remoção|falhado|rejeição|cancelamento|inativação/.test(lower)) return 'danger';
  if (/penalidade|status|bloqueio|atualização|alteração/.test(lower)) return 'warning';
  if (/cadastro|criação|restauração|ativação|aceitação|nova solicitação/.test(lower)) return 'success';
  return 'info';
}

export function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);    // total de registros (para calcular páginas)
  const [page, setPage] = useState(1);      // página atual (começa em 1)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);    // spinner no botão de exportar CSV
  const [exportingPdf, setExportingPdf] = useState(false); // spinner no botão de exportar PDF

  // Estados dos inputs de filtro (o que o usuário está digitando)
  const [filterAcao, setFilterAcao] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  // appliedFilters: filtros que estão efetivamente em vigor na consulta.
  // Só são atualizados ao clicar "Filtrar" (handleFilterSubmit).
  // Isso evita rebuscar a cada tecla digitada.
  const [appliedFilters, setAppliedFilters] = useState({ acao: '', dataInicio: '', dataFim: '' });

  // useEffect: rebusca os logs sempre que a página ou os filtros aplicados mudarem.
  // [page, appliedFilters] → lista de dependências; o efeito roda novamente se qualquer
  // um desses valores mudar.
  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getLogs({
        page,
        limit: PAGE_SIZE,
        // || undefined: se a string for vazia, envia undefined (campo ignorado pela API)
        acao: appliedFilters.acao || undefined,
        dataInicio: appliedFilters.dataInicio || undefined,
        dataFim: appliedFilters.dataFim || undefined,
      })
      .then((data) => {
        setLogs(data.logs || []);
        // ?? → usa 0 se data.totalGeral e data.total forem null/undefined
        setTotal(data.totalGeral ?? data.total ?? 0);
      })
      .catch((err) => {
        const msg = err.message ?? '';
        // Detecta erro 403 (acesso negado) para exibir mensagem específica
        if (msg.includes('403') || msg.toLowerCase().includes('não autorizado')) {
          setError('O log de auditoria é restrito a desenvolvedores (role 2).');
        } else {
          setError('Não foi possível carregar os logs. Tente novamente.');
        }
      })
      .finally(() => setLoading(false));
  }, [page, appliedFilters]);

  // handleFilterSubmit: aplica os filtros ao clicar "Filtrar".
  // e.preventDefault() → evita o reload padrão do formulário HTML.
  // setPage(1) → volta para a primeira página ao aplicar novos filtros.
  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ acao: filterAcao, dataInicio: filterDataInicio, dataFim: filterDataFim });
  }

  // handleFilterReset: limpa todos os filtros e volta para a página 1.
  function handleFilterReset() {
    setFilterAcao('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setPage(1);
    setAppliedFilters({ acao: '', dataInicio: '', dataFim: '' });
  }

  // handleExport: solicita a exportação dos logs como CSV.
  async function handleExport() {
    setExporting(true);
    try {
      await api.exportLogs();
    } finally {
      setExporting(false);
    }
  }

  // handleExportPdf: gera um PDF dos logs visíveis na página atual.
  // jspdf-autotable 5.x não adiciona doc.autoTable via import ESM —
  // é necessário chamar autoTable(doc, {...}) como função diretamente.
  async function handleExportPdf() {
    if (logs.length === 0) return;
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
      doc.text('Auditoria — Logs', 12, 31);

      const totalRows = logs.length;
      autoTable(doc, {
        head: [['Data/Hora', 'Administrador', 'Escola', 'Ação', 'Registro']],
        body: logs.map(log => [
          formatDate(log.criado_em),
          log.admin_nome ?? (log.usu_id ? `Admin #${log.usu_id}` : '—'),
          log.admin_escola ?? '—',
          translateAcao(log.acao),
          log.registro_id != null
            ? (log.registro_nome || `#${log.registro_id}`)
            : '—'
        ]),
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
      doc.save(`auditoria-p${page}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  // totalPages: número total de páginas.
  // Math.ceil arredonda para cima: 21 registros com PAGE_SIZE=20 → 2 páginas.
  // Math.max(1, ...) garante que sempre haverá pelo menos 1 página.
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.container}>
      {/* Toolbar: filtros + botões de export em uma única linha */}
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
          <button className={styles.filterBtnGhost} type="button" onClick={handleFilterReset}>
            Limpar
          </button>
        </form>

        <div className={styles.exportBtnGroup}>
          <button className={styles.exportBtnSecondary} onClick={handleExportPdf} disabled={exportingPdf || logs.length === 0}>
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

      {/* Spinner de carregamento */}
      {loading && <LoadingSpinner size={28} text="Carregando logs..." />}

      {/* Caixa de erro (só exibe quando não está carregando E houve erro) */}
      {!loading && error && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {/* Tabela e paginação (só exibe quando não está carregando E não houve erro) */}
      {!loading && !error && (
        // Fragment (<>) → agrupa elementos sem adicionar nó extra no DOM
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Administrador</th>
                  <th>Escola</th>
                  <th>Ação</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log.audit_id ?? index}
                    // Efeito zebrado: aplica fundo diferente nas linhas pares
                    className={index % 2 === 0 ? styles.rowEven : ''}
                  >
                    <td className={styles.cellDateTime}>{formatDate(log.criado_em)}</td>
                    <td className={styles.cellAdmin}>
                      {log.admin_nome ?? (log.usu_id ? `Admin #${log.usu_id}` : '—')}
                    </td>
                    <td className={styles.cellEscola}>
                      {log.admin_escola ?? '—'}
                    </td>
                    <td>
                      {/* Badge de ação: cor dinâmica via styles[`badge_${variant}`]
                          Isso usa template literal para montar o nome da classe CSS,
                          ex: badge_danger, badge_success, etc. */}
                      <span className={`${styles.actionBadge} ${styles[`badge_${getActionVariant(log.acao)}`]}`}>
                        {translateAcao(log.acao)}
                      </span>
                    </td>
                    <td className={styles.cellRegistro}>
                      {log.registro_id != null
                        ? (log.registro_nome || `#${log.registro_id}`)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className={styles.emptyMsg}>Nenhum registro encontrado.</p>
            )}
          </div>

          {/* Controles de paginação */}
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
