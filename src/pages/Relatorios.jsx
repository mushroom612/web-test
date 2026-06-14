// ============================================================
// pages/Relatorios.jsx — Geração e download de relatórios
//
// Exibe 4 cards de relatório com estatísticas em tempo real.
// Cada botão "Baixar CSV" / "Ver Relatório" chama o endpoint real da API.
//
// RBAC:
//   Admin (per_tipo=1) → vê Caronas e Atividade; Usuários e Penalidades ocultos
//   Dev (per_tipo=2)   → vê todos os 4 relatórios
//
// Endpoints de download (retornam CSV bruto quando ?formato=csv):
//   Caronas     → GET /api/admin/relatorios/caronas?formato=csv   (Admin + Dev)
//   Usuários    → GET /api/dev/relatorios/usuarios?formato=csv     (Dev only)
//   Penalidades → GET /api/dev/relatorios/penalidades?formato=csv  (Dev only)
//   Atividade   → GET /api/admin/relatorios/atividade              (JSON, painel inline)
//
// Filtros do formulário:
//   institution → esc_id para Usuários e Penalidades
//   dateFrom/dateTo → inicio/fim para Caronas
//
// Histórico de relatórios: in-session apenas (sem endpoint de listagem).
//
// Estilo: Relatorios.module.css
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  IconDownload, IconUsers, IconCar, IconAlertCircle, IconChartBar,
  IconLoader2, IconFileText, IconFilter, IconLock, IconFilePlus
} from '@tabler/icons-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Relatorios.module.css';

// HEADER_LABELS: traduz nomes de coluna do banco para português legível.
// Nunca expõe nomenclatura técnica no PDF.
const HEADER_LABELS = {
  // Caronas
  car_data:         'Data',
  car_hor_saida:    'Horário',
  car_hora_saida:   'Horário',
  car_hora:         'Horário',
  car_status:       'Status',
  car_desc:         'Descrição',
  car_vagas:        'Vagas',
  car_vagas_dispo:  'Vagas Disponíveis',
  car_valor:        'Valor (R$)',
  // Motorista
  motorista:        'Motorista',
  motorista_email:  'E-mail do Motorista',
  // Localização
  origem:           'Origem',
  destino:          'Destino',
  car_origem:       'Origem',
  car_destino:      'Destino',
  pon_origem:       'Origem',
  pon_destino:      'Destino',
  ponto_partida:    'Origem',
  ponto_chegada:    'Destino',
  local_origem:     'Origem',
  local_destino:    'Destino',
  // Veículo
  vei_placa:        'Placa',
  vei_marca_modelo: 'Veículo',
  vei_tipo:         'Tipo de Veículo',
  // Usuário
  usu_nome:         'Nome',
  usu_email:        'E-mail',
  usu_status:       'Status',
  per_tipo:         'Perfil',
  // Instituição / Curso
  esc_nome:         'Instituição',
  cur_nome:         'Curso',
  // Penalidades
  pen_tipo:         'Tipo de Penalidade',
  pen_descricao:    'Descrição',
  pen_data:         'Data',
  pen_status:       'Status',
  pen_expira_em:    'Expira em',
  // Genéricos
  data:             'Data',
  status:           'Status',
  nome:             'Nome',
  email:            'E-mail',
  descricao:        'Descrição',
  tipo:             'Tipo',
  valor:            'Valor',
  total:            'Total',
};

// HIDDEN_COLUMNS: IDs internos que nunca devem aparecer no PDF.
const HIDDEN_COLUMNS = new Set([
  'car_id', 'usu_id', 'esc_id', 'cur_id', 'pen_id',
  'den_id', 'sug_id', 'per_id', 'vei_id', 'motorista_id', 'id',
]);

// CARONAS_COLUMN_ORDER: ordem preferida de colunas no PDF de caronas.
// Colunas não listadas aqui ficam no final, na ordem original do CSV.
const CARONAS_COLUMN_ORDER = [
  'motorista', 'usu_nome', 'motorista_email', 'usu_email',
  'car_data', 'car_hor_saida', 'car_hora_saida', 'car_hora',
  'car_status', 'status',
  'origem', 'car_origem', 'pon_origem', 'ponto_partida', 'local_origem',
  'destino', 'car_destino', 'pon_destino', 'ponto_chegada', 'local_destino',
  'vei_placa', 'vei_marca_modelo', 'car_vagas_dispo', 'car_vagas',
  'esc_nome', 'car_desc',
];

// translateHeader: converte nome técnico de coluna para rótulo legível.
// Se não estiver no mapa, limpa o nome (retira prefixo tipo "xxx_",
// substitui _ por espaço, capitaliza) sem nunca mostrar o campo bruto.
function translateHeader(raw) {
  const key = raw.trim().toLowerCase();
  if (HEADER_LABELS[key]) return HEADER_LABELS[key];
  // Fallback: remove prefixo de 3 letras + underscore (ex: "car_", "usu_")
  const cleaned = key.replace(/^[a-z]{2,4}_/, '').replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// iconMap: associa o nome do ícone (string) ao componente JSX
const iconMap = {
  Users:        <IconUsers size={22} />,
  Car:          <IconCar size={22} />,
  AlertCircle:  <IconAlertCircle size={22} />,
  BarChart2:    <IconChartBar size={22} />
};

// REPORT_CARDS: definição estática dos 4 tipos de relatório.
// devOnly: true → visível apenas para Desenvolvedor (per_tipo=2)
const REPORT_CARDS = [
  {
    id:          'caronas',
    icon:        'Car',
    title:       'Relatório de Caronas',
    description: 'Exporta dados de caronas por período (total, status, motoristas).',
    devOnly:     false,
    actionLabel: 'Baixar CSV',
  },
  {
    id:          'usuarios',
    icon:        'Users',
    title:       'Relatório de Usuários',
    description: 'Exporta dados de todos os usuários cadastrados na plataforma.',
    devOnly:     true,
    actionLabel: 'Baixar CSV',
  },
  {
    id:          'penalidades',
    icon:        'AlertCircle',
    title:       'Relatório de Penalidades',
    description: 'Exporta histórico de penalidades aplicadas a usuários.',
    devOnly:     true,
    actionLabel: 'Baixar CSV',
  },
  {
    id:          'atividade',
    icon:        'BarChart2',
    title:       'Relatório de Atividade',
    description: 'Exporta resumo de atividades da plataforma nos últimos 30 dias.',
    devOnly:     false,
    actionLabel: 'Baixar CSV',
  }
];

// statConfig: extrai os valores das estatísticas retornadas por api.getStats()
// para exibir no cabeçalho de cada card.
const statConfig = {
  Car: {
    mainLabel:    'caronas',
    getMain:      (s) => s?.caronas?.total ?? '—',
    getSecondary: (s) => s?.caronas?.finalizadas != null ? `${s.caronas.finalizadas} concluídas` : null
  },
  Users: {
    mainLabel:    'usuários',
    getMain:      (s) => s?.usuarios?.total ?? '—',
    getSecondary: (s) => s?.usuarios?.ativos != null ? `${s.usuarios.ativos} ativos` : null
  },
  AlertCircle: {
    mainLabel:    'denúncias',
    getMain:      (s) => s?.sugestoes?.denuncias ?? '—',
    // sugestoes.abertas = itens abertos/pendentes (não existe campo "pendentes")
    getSecondary: (s) => s?.sugestoes?.abertas != null ? `${s.sugestoes.abertas} abertas` : null
  },
  BarChart2: {
    mainLabel:    'feedbacks',
    getMain:      (s) => s?.sugestoes?.total ?? '—',
    getSecondary: (s) => s?.sugestoes?.fechadas != null ? `${s.sugestoes.fechadas} resolvidos` : null
  }
};

// downloadCSV: cria um Blob a partir do texto CSV e dispara o download no browser.
function downloadCSV(csvText, filename) {
  // '\uFEFF' = BOM UTF-8: garante que Excel abre o CSV com acentos corretamente
  const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export function Relatorios() {
  const { isAdmin, isDev, user } = useAuth();

  // stats: estatísticas das 3 categorias para exibir nos cards
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  // generating: Set com IDs dos relatórios em processo de geração/download
  const [generating, setGenerating] = useState(new Set());

  // statsLoading: true enquanto os stats estão sendo atualizados por filtro
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]     = useState(null);

  // recentList: histórico de downloads feitos na sessão atual
  const [recentList, setRecentList] = useState([]);

  // schools / courses: para os dropdowns de filtro
  const [schools, setSchools]   = useState([]);
  const [courses, setCourses]   = useState([]);

  // filters: o que o usuário está digitando/selecionando nos campos
  const [filters, setFilters] = useState({
    institution: '',
    course:      '',
    dateFrom:    '',
    dateTo:      ''
  });

  // appliedFilters: filtros efetivamente em vigor nos downloads.
  // Só atualizam ao clicar "Aplicar Filtros" — evita download com filtro parcial.
  const [appliedFilters, setAppliedFilters] = useState({
    institution: '',
    course:      '',
    dateFrom:    '',
    dateTo:      ''
  });


  // loadStats: busca os stats passando os filtros como query params.
  // Sem filtros (escId=undefined, datas='') → usa o cache de 5 min do api.js.
  // Com filtros → bypass do cache, retorna contagens reais do período/escola.
  const loadStats = useCallback(async (escId, dateFrom, dateTo) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const escParams     = escId ? { esc_id: escId } : {};
      const caronasParams = {
        ...(dateFrom ? { inicio: dateFrom } : {}),
        ...(dateTo   ? { fim:    dateTo }   : {}),
        ...(isDev && escId ? { esc_id: escId } : {})
      };
      const [sUsuarios, sCaronas, sSugestoes] = await Promise.all([
        api.getStats('usuarios', escParams),
        api.getStats('caronas',  caronasParams),
        api.getStats('sugestoes', escParams)
      ]);
      setStats({
        usuarios:  sUsuarios.stats,
        caronas:   sCaronas.stats,
        sugestoes: sSugestoes.stats
      });
    } catch (e) {
      console.error('[Relatorios] Erro ao carregar estatísticas com filtro:', e);
      setStatsError(e?.message ?? 'Erro ao atualizar estatísticas. Verifique o console.');
    } finally {
      setStatsLoading(false);
    }
  }, [isDev]);

  useEffect(() => {
    async function load() {
      // Fase 1: estatísticas iniciais sem filtros
      await loadStats(undefined, '', '');

      // Fase 2: lista de escolas para o filtro — apenas Dev.
      // GET /api/dev/escolas retorna 403 para Admin, então evitamos a chamada.
      if (isDev) {
        try {
          const data = await api.getSchools();
          setSchools(data?.escolas ?? (Array.isArray(data) ? data : []));
        } catch { /* mantém lista vazia */ }
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega cursos quando uma instituição é selecionada no filtro
  useEffect(() => {
    if (!filters.institution) { setCourses([]); return; }
    const school = schools.find(s => s.esc_nome === filters.institution);
    if (!school) return;
    api.getCourses(school.esc_id)
      .then(d => setCourses(d?.cursos ?? (Array.isArray(d) ? d : [])))
      .catch(() => setCourses([]));
  }, [filters.institution, schools]);

  // selectedEscId: esc_id dos FILTROS APLICADOS (não do que está digitado).
  // Usado em todos os downloads que aceitam esc_id como parâmetro.
  const selectedEscId = appliedFilters.institution
    ? schools.find(s => s.esc_nome === appliedFilters.institution)?.esc_id
    : undefined;

  // hasAppliedFilters: true quando algum filtro está em vigor nos downloads
  const hasAppliedFilters =
    !!appliedFilters.dateFrom || !!appliedFilters.dateTo || !!appliedFilters.institution;

  function handleFilterChange(field, value) {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'institution' ? { course: '' } : {})
    }));
  }

  function handleApplyFilters() {
    const newApplied = { ...filters };
    setAppliedFilters(newApplied);
    // Resolve esc_id a partir do nome da instituição escolhida
    const escId = newApplied.institution
      ? schools.find(s => s.esc_nome === newApplied.institution)?.esc_id
      : undefined;
    loadStats(escId, newApplied.dateFrom, newApplied.dateTo);
  }

  function handleClearFilters() {
    const empty = { institution: '', course: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    loadStats(undefined, '', '');  // volta aos totais globais (usa cache)
  }

  // handleGenerate: despacha para o endpoint correto conforme o id do card.
  // CSV → blob download + adiciona ao histórico de sessão.
  // Atividade → converte JSON da API para CSV e baixa como arquivo.
  async function handleGenerate(report) {
    // Atividade: fetch JSON → converte para CSV → download
    if (report.id === 'atividade') {
      setGenerating(prev => new Set(prev).add('atividade'));
      try {
        const data = await api.getRelatorioAtividade({ dias: 30 });
        // Monta linhas CSV a partir do JSON retornado
        const linhas = [
          'campo,valor',
          `periodo_dias,${data.periodo?.dias ?? 30}`,
          `periodo_inicio,${data.periodo?.inicio ?? ''}`,
          `caronas_total,${data.caronas?.total ?? 0}`,
          `caronas_finalizadas,${data.caronas?.finalizadas ?? 0}`,
          `caronas_canceladas,${data.caronas?.canceladas ?? 0}`,
          `usuarios_novos,${data.usuarios?.novos ?? 0}`,
          `avaliacoes_total,${data.avaliacoes?.total ?? 0}`,
          `avaliacoes_media,${data.avaliacoes?.media != null ? Number(data.avaliacoes.media).toFixed(2) : 0}`,
        ];
        const csvText = linhas.join('\n');
        const hoje = new Date().toISOString().slice(0, 10);
        downloadCSV(csvText, `atividade-${hoje}.csv`);
        setRecentList(prev => [{
          id:    Date.now(),
          title: report.title,
          date:  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          size:  `${(csvText.length / 1024).toFixed(1)} KB`
        }, ...prev]);
      } catch (err) {
        alert('Erro ao gerar relatório de atividade: ' + err.message);
      } finally {
        setGenerating(prev => { const n = new Set(prev); n.delete('atividade'); return n; });
      }
      return;
    }

    setGenerating(prev => new Set(prev).add(report.id));
    try {
      let csvText, filename;
      const hoje = new Date().toISOString().slice(0, 10);

      switch (report.id) {
        case 'caronas':
          // Usa appliedFilters para datas e esc_id (Dev pode filtrar por escola)
          csvText  = await api.downloadRelatorioCaronas({
            inicio:  appliedFilters.dateFrom || undefined,
            fim:     appliedFilters.dateTo   || undefined,
            esc_id:  isDev ? selectedEscId : undefined
          });
          filename = `caronas-${hoje}.csv`;
          break;

        case 'usuarios':
          csvText  = await api.downloadRelatorioUsuarios({ esc_id: selectedEscId });
          filename = `usuarios-${hoje}.csv`;
          break;

        case 'penalidades':
          csvText  = await api.downloadRelatorioPenalidades({ esc_id: selectedEscId });
          filename = `penalidades-${hoje}.csv`;
          break;

        default:
          return;
      }

      // Se a API retornou objeto JSON em vez de texto CSV, extrai a mensagem de erro
      if (typeof csvText !== 'string') {
        const msg = csvText?.error || csvText?.message || 'A API retornou um formato inesperado.';
        alert(`Erro ao gerar relatório: ${msg}`);
        return;
      }
      if (!csvText.trim()) {
        alert('Nenhum dado encontrado para os filtros selecionados.');
        return;
      }

      downloadCSV(csvText, filename);

      // Adiciona ao histórico da sessão
      setRecentList(prev => [{
        id:    Date.now(),
        title: report.title,
        date:  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        size:  `${(csvText.length / 1024).toFixed(1)} KB`
      }, ...prev]);

    } catch (err) {
      alert(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  }

  // handleGeneratePDF: gera PDF com jsPDF + autoTable.
  // Todos os cabeçalhos passam pelo translateHeader() — nenhum nome
  // de coluna do banco aparece no documento final.
  async function handleGeneratePDF(report) {
    const pdfKey = `${report.id}-pdf`;
    setGenerating(prev => new Set(prev).add(pdfKey));
    try {
      const hoje = new Date();
      const hojeStr      = hoje.toISOString().slice(0, 10);
      const hojeFormatado = hoje.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // ── Cabeçalho verde ──────────────────────────────────────────
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, pageW, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('TucTuc', 12, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Gerado em ${hojeFormatado}`, pageW - 12, 13, { align: 'right' });

      // ── Subtítulo ────────────────────────────────────────────────
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(report.title, 12, 31);

      let tableStartY = 36;
      if (user?.esc_nome) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Instituição: ${user.esc_nome}`, 12, 37);
        tableStartY = 43;
      }

      // ── Conteúdo da tabela ────────────────────────────────────────
      if (report.id === 'atividade') {
        const data = await api.getRelatorioAtividade({ dias: 30 });
        autoTable(doc, {
          head: [['Indicador', 'Valor']],
          body: [
            ['Período analisado',  `${data.periodo?.dias ?? 30} dias`],
            ['Início do período',   data.periodo?.inicio ?? '—'],
            ['Total de caronas',    String(data.caronas?.total ?? 0)],
            ['Caronas finalizadas', String(data.caronas?.finalizadas ?? 0)],
            ['Caronas canceladas',  String(data.caronas?.canceladas ?? 0)],
            ['Novos usuários',      String(data.usuarios?.novos ?? 0)],
          ],
          startY: tableStartY,
          styles:      { fontSize: 10, cellPadding: 4 },
          headStyles:  { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90 } },
          alternateRowStyles: { fillColor: [245, 250, 246] },
        });

      } else if (report.id === 'caronas') {
        // O endpoint de CSV de caronas retorna apenas totais agregados (não linhas individuais).
        // Busca os dados individuais via getCaronas() + getCaronaResumo() para montar o PDF.
        const caronasData = await api.getCaronas({
          limit: 100,
          ...(appliedFilters.dateFrom ? { data_inicio: appliedFilters.dateFrom } : {}),
          ...(appliedFilters.dateTo   ? { data_fim:    appliedFilters.dateTo }   : {}),
          ...(isDev && selectedEscId  ? { esc_id: selectedEscId }                : {})
        });
        const caronas = caronasData?.caronas ?? [];

        if (!caronas.length) {
          alert('Nenhum dado encontrado para os filtros selecionados.');
          return;
        }

        // Busca origem/destino de cada carona em paralelo (sem bloquear em caso de falha)
        const resumoResults = await Promise.allSettled(
          caronas.map(c => api.getCaronaResumo(c.car_id))
        );

        // Monta mapa car_id → { origem, destino } com os endereços dos pontos
        const pontosMap = {};
        resumoResults.forEach((res, i) => {
          if (res.status !== 'fulfilled') return;
          const pontos = res.value?.pontos ?? [];
          const o = pontos.find(p => p.pon_tipo === 0);
          const d = pontos.find(p => p.pon_tipo === 1);
          pontosMap[caronas[i].car_id] = {
            origem:  o?.pon_nome || o?.pon_endereco || '—',
            destino: d?.pon_nome || d?.pon_endereco || '—',
          };
        });

        const STATUS_LABEL = { 0: 'Cancelada', 1: 'Aberta', 2: 'Em espera', 3: 'Finalizada' };

        const pdfHeaders = ['Motorista', 'Data', 'Horário', 'Status', 'Origem', 'Destino', 'Vagas', 'Placa'];
        const pdfRows = caronas.map(c => [
          c.motorista     || '—',
          c.car_data      ? new Date(c.car_data).toLocaleDateString('pt-BR') : '—',
          c.car_hor_saida || '—',
          STATUS_LABEL[c.car_status] ?? '—',
          pontosMap[c.car_id]?.origem  || '—',
          pontosMap[c.car_id]?.destino || '—',
          String(c.car_vagas_dispo ?? '—'),
          c.vei_placa     || '—',
        ]);

        const totalRows = pdfRows.length;
        autoTable(doc, {
          head: [pdfHeaders],
          body: pdfRows,
          startY: tableStartY,
          styles:      { fontSize: 7, cellPadding: 3 },
          headStyles:  { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 250, 246] },
          columnStyles: {
            0: { cellWidth: 36 },  // Motorista
            4: { cellWidth: 42 },  // Origem
            5: { cellWidth: 42 },  // Destino
          },
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

      } else {
        // CSV-based: usuarios e penalidades
        let csvText;
        switch (report.id) {
          case 'usuarios':
            csvText = await api.downloadRelatorioUsuarios({ esc_id: selectedEscId });
            break;
          case 'penalidades':
            csvText = await api.downloadRelatorioPenalidades({ esc_id: selectedEscId });
            break;
          default:
            return;
        }

        if (typeof csvText !== 'string' || !csvText.trim()) {
          alert('Nenhum dado encontrado para os filtros selecionados.');
          return;
        }

        const lines = csvText.replace(/^\uFEFF/, '').trim().split('\n');
        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        // Índices das colunas visíveis (sem IDs internos do banco)
        const visibleIdx = rawHeaders
          .map((h, i) => ({ h: h.toLowerCase(), i }))
          .filter(({ h }) => !HIDDEN_COLUMNS.has(h))
          .map(({ i }) => i);

        const headers = visibleIdx.map(i => translateHeader(rawHeaders[i]));
        const rows = lines.slice(1).map(line => {
          const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          return visibleIdx.map(i => cells[i] ?? '');
        });

        const totalRows = rows.length;

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: tableStartY,
          styles:      { fontSize: 8, cellPadding: 3 },
          headStyles:  { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
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
      }

      doc.save(`relatorio-${report.id}-${hojeStr}.pdf`);
      setRecentList(prev => [{
        id:    Date.now(),
        title: `${report.title} (PDF)`,
        date:  hojeFormatado,
        size:  'PDF'
      }, ...prev]);
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err.message}`);
    } finally {
      setGenerating(prev => { const n = new Set(prev); n.delete(`${report.id}-pdf`); return n; });
    }
  }

  // visibleCards: oculta relatórios Dev-only para Admin
  const visibleCards = REPORT_CARDS.filter(r => !r.devOnly || isDev);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <IconLoader2 size={28} className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
      </div>

      {/* ── Card de filtros ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <IconFilter size={15} />
          Filtros
        </div>
        <div className={styles.filterGrid}>

          {/* Instituição: usado por Usuários e Penalidades (Dev only) */}
          {isDev && (
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Instituição</label>
              <select
                className={styles.filterSelect}
                value={filters.institution}
                onChange={e => handleFilterChange('institution', e.target.value)}
              >
                <option value="">Todas as instituições</option>
                {schools.map(s => (
                  <option key={s.esc_id} value={s.esc_nome}>{s.esc_nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Curso: filtro visual (sem endpoint que aceite cur_id ainda) */}
          {isDev && (
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Curso</label>
              <select
                className={styles.filterSelect}
                value={filters.course}
                onChange={e => handleFilterChange('course', e.target.value)}
                disabled={!filters.institution}
              >
                <option value="">Todos os cursos</option>
                {courses.map(c => (
                  <option key={c.cur_id} value={c.cur_nome}>{c.cur_nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Datas: usadas pelo relatório de Caronas */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>De</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateFrom}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Até</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filters.dateTo}
              onChange={e => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.clearBtn} onClick={handleClearFilters}>Limpar</button>
          <button className={styles.applyBtn} onClick={handleApplyFilters}>
            Aplicar Filtros
          </button>
        </div>

        {/* Indicador dos filtros em vigor nos downloads */}
        {hasAppliedFilters && (
          <div className={styles.appliedFiltersInfo}>
            <span className={styles.appliedFiltersLabel}>Filtros ativos:</span>
            {appliedFilters.institution && (
              <span className={styles.filterTag}>{appliedFilters.institution}</span>
            )}
            {appliedFilters.dateFrom && (
              <span className={styles.filterTag}>
                De {appliedFilters.dateFrom}
              </span>
            )}
            {appliedFilters.dateTo && (
              <span className={styles.filterTag}>
                Até {appliedFilters.dateTo}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Erro ao aplicar filtro nos stats */}
      {statsError && (
        <div className={styles.statsErrorBanner}>
          <IconAlertCircle size={14} />
          {statsError}
        </div>
      )}

      {/* ── Grade de cards de relatório ── */}
      <div className={styles.reportsGrid}>
        {visibleCards.map((report) => {
          const cfg            = statConfig[report.icon];
          const mainValue      = cfg?.getMain(stats) ?? '—';
          const secondaryValue = cfg?.getSecondary(stats);
          const isGenerating   = generating.has(report.id);

          return (
            <div key={report.id} className={styles.reportCard}>
              {/* Linha superior: ícone + estatística */}
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  {iconMap[report.icon]}
                </div>
                <div className={styles.cardMainStat}>
                  <span className={styles.mainStatValue}>
                    {statsLoading
                      ? <IconLoader2 size={16} className={styles.btnSpinner} />
                      : mainValue}
                  </span>
                  <span className={styles.mainStatLabel}>{cfg?.mainLabel}</span>
                </div>
              </div>

              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>

              {secondaryValue && (
                <p className={styles.secondaryStat}>{secondaryValue}</p>
              )}

              <div className={styles.cardButtons}>
                {!isAdmin && (
                  <button
                    className={styles.generateBtn}
                    onClick={() => handleGenerate(report)}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? <><IconLoader2 size={14} className={styles.btnSpinner} /> Gerando...</>
                      : <><IconDownload size={14} /> CSV</>}
                  </button>
                )}
                <button
                  className={styles.pdfBtn}
                  onClick={() => handleGeneratePDF(report)}
                  disabled={generating.has(`${report.id}-pdf`)}
                >
                  {generating.has(`${report.id}-pdf`)
                    ? <><IconLoader2 size={14} className={styles.btnSpinner} /> Gerando...</>
                    : <><IconFilePlus size={14} /> PDF</>}
                </button>
              </div>
            </div>
          );
        })}

        {/* Mensagem para Admin informando que outros relatórios são Dev-only */}
        {isAdmin && (
          <div className={`${styles.reportCard} ${styles.reportCardLocked}`}>
            <div className={styles.cardTop}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperLocked}`}>
                <IconLock size={22} />
              </div>
            </div>
            <h3 className={styles.reportTitle}>Usuários &amp; Penalidades</h3>
            <p className={styles.reportDescription}>
              Os relatórios de Usuários e Penalidades são exclusivos para Desenvolvedores.
            </p>
          </div>
        )}
      </div>

      {/* ── Histórico de downloads da sessão ── */}
      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Relatórios Baixados nesta Sessão</h2>
        <div className={styles.reportsList}>
          {recentList.length === 0 && (
            <p className={styles.emptyMessage}>Nenhum relatório baixado ainda. Use os botões acima para gerar.</p>
          )}
          {recentList.map((r) => (
            <div key={r.id} className={styles.reportItem}>
              <div className={styles.reportItemIcon}>
                <IconFileText size={18} />
              </div>
              <div className={styles.reportInfo}>
                <p className={styles.reportName}>{r.title}</p>
                <span className={styles.reportDate}>{r.date}</span>
              </div>
              <div className={styles.reportMeta}>
                <span className={styles.reportSize}>{r.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
