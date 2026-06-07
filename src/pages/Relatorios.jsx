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
  Download, Users, Car, AlertCircle, BarChart2,
  Loader2, FileText, Filter, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Relatorios.module.css';

// iconMap: associa o nome do ícone (string) ao componente JSX
const iconMap = {
  Users:        <Users size={22} />,
  Car:          <Car size={22} />,
  AlertCircle:  <AlertCircle size={22} />,
  BarChart2:    <BarChart2 size={22} />
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
  // '﻿' = BOM UTF-8: garante que Excel abre o CSV com acentos corretamente
  const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8;' });
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
  const { isAdmin, isDev } = useAuth();

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

  // visibleCards: oculta relatórios Dev-only para Admin
  const visibleCards = REPORT_CARDS.filter(r => !r.devOnly || isDev);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loader2 size={28} className={styles.spinner} />
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
          <Filter size={15} />
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
          <AlertCircle size={14} />
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
                      ? <Loader2 size={16} className={styles.btnSpinner} />
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

              {/* Botão de download — todos os cards usam o mesmo padrão */}
              <button
                className={styles.generateBtn}
                onClick={() => handleGenerate(report)}
                disabled={isGenerating}
              >
                {isGenerating
                  ? <><Loader2 size={14} className={styles.btnSpinner} /> Gerando...</>
                  : <><Download size={14} /> {report.actionLabel}</>}
              </button>
            </div>
          );
        })}

        {/* Mensagem para Admin informando que outros relatórios são Dev-only */}
        {isAdmin && (
          <div className={`${styles.reportCard} ${styles.reportCardLocked}`}>
            <div className={styles.cardTop}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperLocked}`}>
                <Lock size={22} />
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
                <FileText size={18} />
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
