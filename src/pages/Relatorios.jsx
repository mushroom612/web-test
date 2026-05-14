import { useState, useEffect } from 'react';
import { Download, Users, Car, AlertCircle, BarChart2, Loader2, FileText, Filter } from 'lucide-react';
import { api } from '../services/api';
import { reportsData, recentReports } from '../data/mockData';
import styles from './Relatorios.module.css';

const iconMap = {
  Users: <Users size={22} />,
  Car: <Car size={22} />,
  AlertCircle: <AlertCircle size={22} />,
  BarChart2: <BarChart2 size={22} />
};

const statConfig = {
  Users: {
    mainLabel: 'usuários',
    getMain: (s) => s?.usuarios?.total ?? '—',
    getSecondary: (s) => s?.usuarios?.ativos != null ? `${s.usuarios.ativos} ativos` : null,
  },
  Car: {
    mainLabel: 'caronas',
    getMain: (s) => s?.caronas?.total ?? '—',
    getSecondary: (s) => s?.caronas?.finalizadas != null ? `${s.caronas.finalizadas} concluídas` : null,
  },
  AlertCircle: {
    mainLabel: 'denúncias',
    getMain: (s) => s?.sugestoes?.denuncias ?? '—',
    getSecondary: (s) => s?.sugestoes?.pendentes != null ? `${s.sugestoes.pendentes} pendentes` : null,
  },
  BarChart2: {
    mainLabel: 'registros',
    getMain: (s) => (s?.usuarios?.total ?? 0) + (s?.caronas?.total ?? 0),
    getSecondary: (s) => s?.sugestoes?.resolvidas != null ? `${s.sugestoes.resolvidas} resolvidos` : null,
  }
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR');
}

export function Relatorios() {
  const [recentList, setRecentList] = useState(recentReports);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(new Set());
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ institution: '', course: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
    async function load() {
      try {
        const [statsUsuarios, statsCaronas, statsSugestoes] = await Promise.all([
          api.getStats('usuarios'),
          api.getStats('caronas'),
          api.getStats('sugestoes')
        ]);
        setStats({
          usuarios: statsUsuarios.stats,
          caronas: statsCaronas.stats,
          sugestoes: statsSugestoes.stats
        });
      } catch {
        // mantém sem stats
      }

      try {
        const data = await api.getRecentReports();
        const lista = data.relatorios || data.data || [];
        if (lista.length > 0) {
          setRecentList(lista.map(r => ({
            id: r.rel_id,
            title: r.rel_titulo,
            date: formatDate(r.rel_gerado_em),
            size: r.rel_tamanho
          })));
        }
      } catch {
        // mantém mock
      }

      try {
        const [schoolsList, coursesList] = await Promise.all([
          api.getSchools(),
          api.getCourses()
        ]);
        setSchools(schoolsList);
        setCourses(coursesList);
      } catch {
        // mantém vazio
      }

      setLoading(false);
    }
    load();
  }, []);

  const filteredCourses = filters.institution
    ? courses.filter(c => {
        const school = schools.find(s => s.esc_nome === filters.institution);
        return school ? c.esc_id === school.esc_id : true;
      })
    : courses;

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

  async function handleGenerate(report) {
    setGenerating(prev => new Set(prev).add(report.id));
    try {
      const generated = await api.generateReport(report.icon);
      setRecentList(prev => [
        {
          id: generated.rel_id,
          title: generated.rel_titulo,
          date: formatDate(generated.rel_gerado_em),
          size: generated.rel_tamanho
        },
        ...prev
      ]);
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  }

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

      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <Filter size={15} />
          Filtros
        </div>
        <div className={styles.filterGrid}>
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
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Curso</label>
            <select
              className={styles.filterSelect}
              value={filters.course}
              onChange={e => handleFilterChange('course', e.target.value)}
              disabled={!filters.institution}
            >
              <option value="">Todos os cursos</option>
              {filteredCourses.map(c => (
                <option key={c.cur_id} value={c.cur_nome}>{c.cur_nome}</option>
              ))}
            </select>
          </div>
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
          <button className={styles.applyBtn}>Aplicar Filtros</button>
        </div>
      </div>

      <div className={styles.reportsGrid}>
        {reportsData.map((report) => {
          const cfg = statConfig[report.icon];
          const mainValue = cfg?.getMain(stats) ?? '—';
          const secondaryValue = cfg?.getSecondary(stats);
          const isGenerating = generating.has(report.id);
          return (
            <div key={report.id} className={styles.reportCard}>
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
              <button
                className={styles.generateBtn}
                onClick={() => handleGenerate(report)}
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 size={14} className={styles.btnSpinner} />}
                {isGenerating ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Relatórios Gerados Recentemente</h2>
        <div className={styles.reportsList}>
          {recentList.length === 0 && (
            <p className={styles.emptyMessage}>Nenhum relatório gerado ainda.</p>
          )}
          {recentList.map((report) => (
            <div key={report.id} className={styles.reportItem}>
              <div className={styles.reportItemIcon}>
                <FileText size={18} />
              </div>
              <div className={styles.reportInfo}>
                <p className={styles.reportName}>{report.title}</p>
                <span className={styles.reportDate}>{report.date}</span>
              </div>
              <div className={styles.reportMeta}>
                <span className={styles.reportSize}>{report.size}</span>
                <button className={styles.downloadBtn} title="Baixar">
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
