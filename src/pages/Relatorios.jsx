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

import { useState, useEffect } from 'react';
import {
  Download, Users, Car, AlertCircle, BarChart2,
  Loader2, FileText, Filter, ChevronDown, ChevronUp, Lock
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
    description: 'Resumo de atividades da plataforma no período selecionado.',
    devOnly:     false,
    actionLabel: 'Ver Relatório',
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
    getSecondary: (s) => s?.sugestoes?.pendentes != null ? `${s.sugestoes.pendentes} pendentes` : null
  },
  BarChart2: {
    mainLabel:    'registros',
    getMain:      (s) => (s?.usuarios?.total ?? 0) + (s?.caronas?.total ?? 0),
    getSecondary: (s) => s?.sugestoes?.resolvidas != null ? `${s.sugestoes.resolvidas} resolvidos` : null
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

// formatDate: converte ISO string para data pt-BR
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR');
}

export function Relatorios() {
  const { isAdmin, isDev } = useAuth();

  // stats: estatísticas das 3 categorias para exibir nos cards
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  // generating: Set com IDs dos relatórios em processo de geração/download
  const [generating, setGenerating] = useState(new Set());

  // recentList: histórico de downloads feitos na sessão atual
  const [recentList, setRecentList] = useState([]);

  // schools / courses: para os dropdowns de filtro
  const [schools, setSchools]   = useState([]);
  const [courses, setCourses]   = useState([]);

  // filters: estado dos campos de filtro do formulário
  const [filters, setFilters] = useState({
    institution: '',
    course:      '',
    dateFrom:    '',
    dateTo:      ''
  });

  // atividadeData: resultado do GET /api/admin/relatorios/atividade (JSON)
  // null = não carregado, objeto = resultado atual
  const [atividadeData, setAtividadeData]     = useState(null);
  const [atividadeOpen, setAtividadeOpen]     = useState(false);
  const [atividadeLoading, setAtividadeLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // Fase 1: estatísticas para os cards (crítico)
      try {
        const [sUsuarios, sCaronas, sSugestoes] = await Promise.all([
          api.getStats('usuarios'),
          api.getStats('caronas'),
          api.getStats('sugestoes')
        ]);
        setStats({
          usuarios:  sUsuarios.stats,
          caronas:   sCaronas.stats,
          sugestoes: sSugestoes.stats
        });
      } catch {
        // stats permanece null; cards mostram '—'
      }

      // Fase 2: listas para filtros (tolerante a falha)
      try {
        const data = await api.getSchools();
        setSchools(data?.escolas ?? (Array.isArray(data) ? data : []));
      } catch { /* mantém lista vazia */ }

      setLoading(false);
    }
    load();
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

  // selectedEscId: resolve o esc_id a partir do nome da escola selecionada no filtro.
  // Usado por Usuários e Penalidades que aceitam esc_id como parâmetro.
  const selectedEscId = filters.institution
    ? schools.find(s => s.esc_nome === filters.institution)?.esc_id
    : undefined;

  function handleFilterChange(field, value) {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'institution' ? { course: '' } : {})
    }));
  }

  function handleClearFilters() {
    setFilters({ institution: '', course: '', dateFrom: '', dateTo: '' });
  }

  // handleGenerate: despacha para o endpoint correto conforme o id do card.
  // CSV → blob download + adiciona ao histórico de sessão.
  // Atividade → painel inline com dados JSON.
  async function handleGenerate(report) {
    // Atividade: toggle do painel de resumo
    if (report.id === 'atividade') {
      if (atividadeOpen) { setAtividadeOpen(false); return; }
      setAtividadeLoading(true);
      setAtividadeOpen(true);
      try {
        const data = await api.getRelatorioAtividade({ dias: 30 });
        setAtividadeData(data);
      } catch (err) {
        alert('Erro ao carregar relatório de atividade: ' + err.message);
        setAtividadeOpen(false);
      } finally {
        setAtividadeLoading(false);
      }
      return;
    }

    setGenerating(prev => new Set(prev).add(report.id));
    try {
      let csvText, filename;
      const hoje = new Date().toISOString().slice(0, 10);

      switch (report.id) {
        case 'caronas':
          csvText  = await api.downloadRelatorioCaronas({
            inicio: filters.dateFrom || undefined,
            fim:    filters.dateTo   || undefined
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

      if (typeof csvText !== 'string' || !csvText.trim()) {
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
        </div>
      </div>

      {/* ── Grade de cards de relatório ── */}
      <div className={styles.reportsGrid}>
        {visibleCards.map((report) => {
          const cfg          = statConfig[report.icon];
          const mainValue    = cfg?.getMain(stats) ?? '—';
          const secondaryValue = cfg?.getSecondary(stats);
          const isGenerating = generating.has(report.id);
          const isAtividade  = report.id === 'atividade';

          return (
            <div key={report.id} className={styles.reportCard}>
              {/* Linha superior: ícone + estatística */}
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  {iconMap[report.icon]}
                </div>
                <div className={styles.cardMainStat}>
                  <span className={styles.mainStatValue}>{mainValue}</span>
                  <span className={styles.mainStatLabel}>{cfg?.mainLabel}</span>
                </div>
              </div>

              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>

              {secondaryValue && (
                <p className={styles.secondaryStat}>{secondaryValue}</p>
              )}

              {/* Botão principal */}
              <button
                className={styles.generateBtn}
                onClick={() => handleGenerate(report)}
                disabled={isGenerating || (isAtividade && atividadeLoading)}
              >
                {isGenerating || (isAtividade && atividadeLoading)
                  ? <><Loader2 size={14} className={styles.btnSpinner} /> Carregando...</>
                  : isAtividade
                    ? <>{atividadeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {atividadeOpen ? 'Fechar' : report.actionLabel}</>
                    : <><Download size={14} /> {report.actionLabel}</>}
              </button>

              {/* Painel de atividade (só para o card Atividade) */}
              {isAtividade && atividadeOpen && (
                <div className={styles.atividadePanel}>
                  {atividadeLoading || !atividadeData ? (
                    <Loader2 size={16} className={styles.btnSpinner} />
                  ) : (
                    <div className={styles.atividadeGrid}>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Período</span>
                        <span className={styles.atividadeValue}>
                          {atividadeData.periodo?.dias ?? 30} dias
                          {atividadeData.periodo?.inicio && ` (desde ${formatDate(atividadeData.periodo.inicio)})`}
                        </span>
                      </div>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Caronas no período</span>
                        <span className={styles.atividadeValue}>{atividadeData.caronas?.total ?? '—'}</span>
                      </div>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Finalizadas</span>
                        <span className={styles.atividadeValue}>{atividadeData.caronas?.finalizadas ?? '—'}</span>
                      </div>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Canceladas</span>
                        <span className={styles.atividadeValue}>{atividadeData.caronas?.canceladas ?? '—'}</span>
                      </div>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Novos usuários</span>
                        <span className={styles.atividadeValue}>{atividadeData.usuarios?.novos ?? '—'}</span>
                      </div>
                      <div className={styles.atividadeItem}>
                        <span className={styles.atividadeLabel}>Avaliações</span>
                        <span className={styles.atividadeValue}>
                          {atividadeData.avaliacoes?.total ?? '—'}
                          {atividadeData.avaliacoes?.media != null && ` (média ${Number(atividadeData.avaliacoes.media).toFixed(1)})`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
