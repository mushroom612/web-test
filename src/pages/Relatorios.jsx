// ============================================================
// pages/Relatorios.jsx — Página de geração e visualização de relatórios
//
// Exibe cards para gerar 4 tipos de relatório (Usuários, Caronas,
// Denúncias, Atividade Geral) e lista os relatórios gerados recentemente.
//
// Estrutura visual:
//   ┌────────────────────────────────────┐
//   │  [Filtros: instituição/curso/datas]│
//   ├──────┬──────┬──────┬──────────────┤
//   │ Card │ Card │ Card │ Card (gerar) │  ← reportsGrid
//   ├────────────────────────────────────┤
//   │  Relatórios Gerados Recentemente  │  ← recentSection
//   └────────────────────────────────────┘
//
// Funcionalidades:
//   - Cards de relatório com estatísticas em tempo real (via API)
//   - Cada card tem um botão "Gerar" que chama api.generateReport()
//   - Um Set rastreia quais relatórios estão sendo gerados (para
//     desabilitar o botão e mostrar spinner individualmente)
//   - Filtros de instituição, curso e intervalo de datas
//   - Cursos filtrados dinamicamente pela instituição selecionada
//   - Lista de relatórios recentes (da API ou do mockData como fallback)
//
// Bibliotecas usadas:
//   - react → useState, useEffect
//   - lucide-react → Download, Users, Car, AlertCircle, BarChart2,
//                    Loader2, FileText, Filter
//
// Dados consumidos:
//   - api.getStats('usuarios'), api.getStats('caronas'), api.getStats('sugestoes')
//     → estatísticas para exibir nos cards
//   - api.getRecentReports() → lista de relatórios recentes
//   - api.generateReport()   → gera um novo relatório
//   - api.getSchools()        → lista de instituições para o filtro
//   - api.getCourses()        → lista de cursos para o filtro
//   - reportsData             → definição estática dos 4 cards (de mockData.js)
//   - recentReports           → lista inicial de relatórios recentes (de mockData.js)
//
// Interligação:
//   - Importa: api.js, mockData.js (reportsData, recentReports)
//
// Estilo: Relatorios.module.css
//   Classes CSS utilizadas:
//     .container       → área raiz da página
//     .header          → cabeçalho com título
//     .title           → texto "Relatórios"
//     .filterCard      → card de filtros com borda e padding
//     .filterHeader    → linha "Filtros" com ícone
//     .filterGrid      → grade de campos de filtro
//     .filterField     → grupo label + select/input de um filtro
//     .filterLabel     → etiqueta do filtro (ex: "Instituição")
//     .filterSelect    → dropdown de seleção
//     .filterInput     → campo de data
//     .filterActions   → linha de botões "Limpar" e "Aplicar"
//     .clearBtn        → botão "Limpar"
//     .applyBtn        → botão "Aplicar Filtros"
//     .reportsGrid     → grade de cards de relatório (4 colunas)
//     .reportCard      → card individual de relatório
//     .cardTop         → linha superior do card: ícone + estatística
//     .iconWrapper     → círculo com o ícone do relatório
//     .cardMainStat    → exibe o número e rótulo da estatística principal
//     .mainStatValue   → número grande (ex: "247")
//     .mainStatLabel   → rótulo embaixo do número (ex: "usuários")
//     .reportTitle     → título do relatório (ex: "Relatório de Usuários")
//     .reportDescription → breve descrição do relatório
//     .secondaryStat   → estatística secundária (ex: "200 ativos")
//     .generateBtn     → botão "Gerar" (ou "Gerando..." com spinner)
//     .btnSpinner      → ícone Loader2 giratório no botão
//     .recentSection   → seção de relatórios recentes
//     .sectionTitle    → título "Relatórios Gerados Recentemente"
//     .reportsList     → lista de relatórios gerados
//     .emptyMessage    → mensagem quando não há relatórios
//     .reportItem      → linha de um relatório na lista recente
//     .reportItemIcon  → ícone FileText à esquerda
//     .reportInfo      → nome e data do relatório
//     .reportName      → nome do arquivo de relatório
//     .reportDate      → data de geração
//     .reportMeta      → tamanho do arquivo + botão de download
//     .reportSize      → tamanho (ex: "2.3 MB")
//     .downloadBtn     → botão de download (ícone)
//     .loadingWrapper  → spinner centralizado na tela de carregamento
//     .spinner         → ícone Loader2 giratório
// ============================================================

import { useState, useEffect } from 'react';
import { Download, Users, Car, AlertCircle, BarChart2, Loader2, FileText, Filter } from 'lucide-react';
import { api } from '../services/api';
import { reportsData, recentReports } from '../data/mockData';
import styles from './Relatorios.module.css';

// iconMap: associa o nome do ícone (string, vindo do mockData) ao componente JSX.
// Isso permite usar os ícones dinamicamente pelo nome sem precisar de if/switch.
const iconMap = {
  Users: <Users size={22} />,
  Car: <Car size={22} />,
  AlertCircle: <AlertCircle size={22} />,
  BarChart2: <BarChart2 size={22} />
};

// statConfig: para cada tipo de relatório (identificado pelo nome do ícone),
// define como extrair os dados de stats para exibir no card.
//   mainLabel   → rótulo da estatística principal (ex: 'usuários')
//   getMain     → função que extrai o valor principal do objeto stats
//   getSecondary → função que extrai a estatística secundária (pode retornar null)
// O operador ?. (optional chaining) acessa propriedades sem erro se o objeto for null.
// O operador ?? (nullish coalescing) retorna '—' se o valor for null/undefined.
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
    // Soma total de usuários + total de caronas como "atividade geral"
    getMain: (s) => (s?.usuarios?.total ?? 0) + (s?.caronas?.total ?? 0),
    getSecondary: (s) => s?.sugestoes?.resolvidas != null ? `${s.sugestoes.resolvidas} resolvidos` : null,
  }
};

// formatDate: converte uma string ISO de data para o padrão brasileiro (dd/mm/aaaa).
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR');
}

export function Relatorios() {
  // recentList: lista de relatórios gerados recentemente.
  // Começa com dados mock e é substituída pelos dados da API se disponíveis.
  const [recentList, setRecentList] = useState(recentReports);

  // stats: objeto com estatísticas das 3 categorias (usuarios, caronas, sugestoes).
  // null = ainda carregando; preenchido = dados reais da API.
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);

  // generating: Set (conjunto) com os IDs dos relatórios em processo de geração.
  // Usar Set em vez de array porque Set.has() é mais eficiente para verificar presença.
  // Isso permite spinner e disabled individuais por card.
  const [generating, setGenerating] = useState(new Set());

  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);

  // filters: estado do formulário de filtros.
  const [filters, setFilters] = useState({ institution: '', course: '', dateFrom: '', dateTo: '' });

  // useEffect: carrega dados da API ao montar o componente.
  // Três chamadas simultâneas (Promise.all) + duas sequenciais separadas.
  useEffect(() => {
    async function load() {
      try {
        // Promise.all: executa as 3 chamadas em paralelo para ganhar tempo
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
        // Se a API falhar, stats permanece null e os cards mostram '—'
      }

      try {
        const data = await api.getRecentReports();
        const lista = data.relatorios || data.data || [];
        if (lista.length > 0) {
          // Converte o formato da API para o formato da lista
          setRecentList(lista.map(r => ({
            id: r.rel_id,
            title: r.rel_titulo,
            date: formatDate(r.rel_gerado_em),
            size: r.rel_tamanho
          })));
        }
      } catch {
        // Mantém recentReports do mockData como fallback
      }

      try {
        // Promise.all para buscar escolas e cursos em paralelo
        const [schoolsList, coursesList] = await Promise.all([
          api.getSchools(),
          api.getCourses()
        ]);
        setSchools(schoolsList);
        setCourses(coursesList);
      } catch {
        // Mantém listas vazias
      }

      setLoading(false);
    }
    load();
  }, []); // [] = executa uma única vez ao montar

  // filteredCourses: quando uma instituição está selecionada, mostra
  // apenas os cursos daquela instituição no dropdown.
  const filteredCourses = filters.institution
    ? courses.filter(c => {
        // Encontra o objeto da escola pelo nome para obter o esc_id
        const school = schools.find(s => s.esc_nome === filters.institution);
        return school ? c.esc_id === school.esc_id : true;
      })
    : courses;

  // handleFilterChange: atualiza um campo dos filtros.
  // Ao mudar a instituição, também limpa o curso selecionado
  // (pois os cursos disponíveis mudam com a instituição).
  // Isso usa o spread condicional: ...(condition ? { key: val } : {})
  // — se a condição for verdadeira, adiciona o campo; caso contrário, não.
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

  // handleGenerate: gera um relatório e adiciona na lista de recentes.
  // Adiciona o ID ao Set "generating" antes da chamada e remove depois.
  // Isso cria o efeito de "loading individual por botão".
  async function handleGenerate(report) {
    // new Set(prev).add(report.id) → cria um novo Set (React exige novos objetos)
    // com o ID do relatório adicionado
    setGenerating(prev => new Set(prev).add(report.id));
    try {
      const generated = await api.generateReport(report.icon);
      // Adiciona o novo relatório no início da lista (mais recente primeiro)
      setRecentList(prev => [
        {
          id: generated.rel_id,
          title: generated.rel_titulo,
          date: formatDate(generated.rel_gerado_em),
          size: generated.rel_tamanho
        },
        ...prev  // ... spread: mantém todos os relatórios anteriores após o novo
      ]);
    } finally {
      // Remove o ID do Set após concluir (sucesso ou erro)
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  }

  // Tela de carregamento: exibida enquanto a API não responde
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

      {/* ── Card de filtros ────────────────────────────────────── */}
      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <Filter size={15} />
          Filtros
        </div>
        <div className={styles.filterGrid}>

          {/* Filtro: Instituição */}
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

          {/* Filtro: Curso (desabilitado se nenhuma instituição selecionada) */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Curso</label>
            <select
              className={styles.filterSelect}
              value={filters.course}
              onChange={e => handleFilterChange('course', e.target.value)}
              disabled={!filters.institution}  // desabilitado sem instituição
            >
              <option value="">Todos os cursos</option>
              {filteredCourses.map(c => (
                <option key={c.cur_id} value={c.cur_nome}>{c.cur_nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro: intervalo de datas */}
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

      {/* ── Grade de cards de relatório ───────────────────────── */}
      <div className={styles.reportsGrid}>
        {/* reportsData vem do mockData.js e define os 4 tipos de relatório */}
        {reportsData.map((report) => {
          // cfg: configuração de como exibir as estatísticas para este tipo
          const cfg = statConfig[report.icon];
          // Extrai os valores numéricos do objeto stats (pode ser null)
          const mainValue = cfg?.getMain(stats) ?? '—';
          const secondaryValue = cfg?.getSecondary(stats);
          // isGenerating: verifica se este relatório específico está gerando agora
          const isGenerating = generating.has(report.id);

          return (
            <div key={report.id} className={styles.reportCard}>
              {/* Linha superior: ícone + estatística principal */}
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  {/* iconMap[report.icon] → componente JSX do ícone (ex: <Users />) */}
                  {iconMap[report.icon]}
                </div>
                <div className={styles.cardMainStat}>
                  <span className={styles.mainStatValue}>{mainValue}</span>
                  <span className={styles.mainStatLabel}>{cfg?.mainLabel}</span>
                </div>
              </div>

              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>

              {/* Estatística secundária: só exibe se existir */}
              {secondaryValue && (
                <p className={styles.secondaryStat}>{secondaryValue}</p>
              )}

              {/* Botão "Gerar": mostra spinner e texto "Gerando..." enquanto processa */}
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

      {/* ── Lista de relatórios recentes ──────────────────────── */}
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
