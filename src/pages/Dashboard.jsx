// ============================================================
// pages/Dashboard.jsx — Página inicial do painel
//
// É a primeira tela vista após o login. Mostra um resumo
// visual da plataforma: métricas, gráfico e feedbacks recentes.
//
// Estrutura visual:
//   ┌─────────────────────────────────────────┐
//   │  [Card] [Card] [Card] [Card]  ← métricas│
//   ├────────────────────┬────────────────────┤
//   │   Gráfico de barras│ Feedbacks recentes │
//   └────────────────────┴────────────────────┘
//
// Bibliotecas usadas:
//   - react              → useState, useEffect
//   - react-router-dom   → useNavigate (para redirecionar ao clicar em feedback)
//   - lucide-react       → ícones dos cards de métricas
//   - recharts           → biblioteca de gráficos para React
//       AreaChart, Area  → gráfico de área (curva preenchida)
//       XAxis, YAxis     → eixos do gráfico
//       CartesianGrid    → grade de fundo
//       Tooltip          → caixa de detalhes ao passar o mouse
//       ResponsiveContainer → faz o gráfico se adaptar ao tamanho do contêiner
//
// Dados consumidos:
//   - api.getStats()     → contadores de usuários, caronas, sugestões
//   - api.getSugestoes() → feedbacks recentes para exibir no painel
//   - metricsData        → fallback de métricas quando a API falha
//   - feedbacksData      → fallback de feedbacks quando a API falha
//   - chartData          → dados do gráfico (estáticos por enquanto)
//
// Estilo: Dashboard.module.css
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Car, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { metricsData, feedbacksData, chartData } from '../data/mockData';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Dashboard.module.css';

// formatSugestao: converte o formato de API (sug_*) para o formato
// que os componentes visuais esperam (userName, type, status, etc.).
// Isso desacopla a camada de dados da camada de apresentação.
function formatSugestao(s) {
  return {
    id: s.sug_id,
    userName: s.usu_nome || `Usuário #${s.usu_id}`,
    // charAt(0).toUpperCase() → pega a primeira letra do nome como avatar
    avatar: (s.usu_nome || 'U').charAt(0).toUpperCase(),
    text: s.sug_texto,
    // Operador ternário encadeado: traduz o número do tipo para texto
    type: s.sug_tipo === 1 ? 'Denúncia' : 'Sugestão',
    status: s.sug_status === 1 ? 'Resolvido'
      : s.sug_status === 2 ? 'Em análise'
      : 'Pendente',
    // toLocaleDateString formata a data no padrão brasileiro (dd/mm/aaaa)
    date: new Date(s.criado_em).toLocaleDateString('pt-BR')
  };
}

// METRIC_CONFIG: define o ícone e as cores de cada card de métrica.
// Usa índice posicional — o card 0 (Total de Usuários) usa a config [0], etc.
const METRIC_CONFIG = [
  { Icon: Users,        iconColor: '#3b82f6', iconBg: '#dbeafe' }, // azul
  { Icon: Car,          iconColor: '#8b5cf6', iconBg: '#ede9fe' }, // roxo
  { Icon: CheckCircle,  iconColor: '#22c55e', iconBg: '#dcfce7' }, // verde
  { Icon: AlertCircle,  iconColor: '#f59e0b', iconBg: '#fef3c7' }  // amarelo
];

// ChartTooltip: componente customizado para o tooltip do gráfico.
// Substituímos o tooltip padrão do recharts por este para controlar o visual.
// active: true quando o mouse está sobre uma barra
// payload: array com os dados da barra em foco
// label: rótulo do eixo X (ex: 'Seg')
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    // styles.chartTooltip → caixa flutuante que aparece ao passar o mouse
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value} caronas</p>
    </div>
  );
}

export function Dashboard() {
  // useNavigate: usado para redirecionar ao clicar em um feedback
  const navigate = useNavigate();

  // metrics: dados das estatísticas vindos da API.
  // null = ainda não carregou; quando preenchido, mostra dados reais.
  const [metrics, setMetrics] = useState(null);

  // feedbacks: lista de feedbacks recentes. Começa com dados mock
  // e é substituída pelos dados da API se a chamada tiver sucesso.
  const [feedbacks, setFeedbacks] = useState(feedbacksData);

  const [loading, setLoading] = useState(true);

  // useEffect: executa a função "load" uma única vez, quando o
  // componente é montado (o array [] vazio é o sinal para isso).
  // É usado aqui para buscar dados da API ao abrir a página.
  useEffect(() => {
    async function load() {
      try {
        // Promise.all: executa as 3 chamadas à API em paralelo
        // (ao mesmo tempo) e espera todas terminarem.
        // Muito mais rápido do que chamar uma por vez!
        const [statsUsuarios, statsCaronas, statsSugestoes] = await Promise.all([
          api.getStats('usuarios'),
          api.getStats('caronas'),
          api.getStats('sugestoes')
        ]);
        setMetrics({
          usuarios: statsUsuarios.stats,
          caronas: statsCaronas.stats,
          sugestoes: statsSugestoes.stats
        });
      } catch {
        // Se a API falhar, mantém null e usa metricsData (mock) abaixo
      }

      try {
        const data = await api.getSugestoes();
        const lista = data.sugestoes || data.data || [];
        if (lista.length > 0) {
          // .slice(0, 4) → pega apenas os 4 feedbacks mais recentes
          // .map(formatSugestao) → converte cada item para o formato visual
          setFeedbacks(lista.slice(0, 4).map(formatSugestao));
        }
      } catch {
        // mantém feedbacksData (mock)
      }

      setLoading(false);
    }
    load();
  }, []); // [] = executa só na montagem do componente

  // metricsDisplay: dados que serão exibidos nos cards.
  // Se metrics (API) está preenchido, usa os dados reais.
  // Se não (API falhou), usa metricsData do mockData.js.
  // O operador ?? é "nullish coalescing": retorna o lado direito
  // apenas se o lado esquerdo for null ou undefined.
  const metricsDisplay = metrics
    ? [
        {
          id: 1,
          label: 'Total de Usuários',
          value: metrics.usuarios.total,
          trend: `${metrics.usuarios.ativos} ativos`,
          trendUp: true
        },
        {
          id: 2,
          label: 'Total de Caronas',
          value: metrics.caronas.total,
          trend: `${metrics.caronas.abertas} abertas`,
          trendUp: true
        },
        {
          id: 3,
          label: 'Caronas Finalizadas',
          value: metrics.caronas.finalizadas,
          trend: 'realizadas com sucesso',
          trendUp: true
        },
        {
          id: 4,
          label: 'Sugestões Pendentes',
          value: metrics.sugestoes.pendentes ?? 0,
          trend: `${metrics.sugestoes.total} no total`,
          trendUp: (metrics.sugestoes.pendentes ?? 0) === 0
        }
      ]
    : metricsData; // fallback para dados mock

  // Tela de carregamento: exibida enquanto a API não respondeu
  if (loading) {
    return (
      <div className={styles.dashboard}>
        {/* styles.loadingWrap → centraliza o spinner na tela */}
        <div className={styles.loadingWrap}>
          {/* styles.spin → animação CSS de rotação aplicada ao ícone */}
          <Loader2 size={32} className={styles.spin} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Cabeçalho da página */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Visão geral da plataforma Tuctuc</p>
      </div>
      <div className={styles.userFeedback}>
{/* ── Grade de cards de métricas ───────────────────────────
          styles.metricsGrid = display: grid com 4 colunas
          Cada card é independente e recebe seu próprio ícone e cor. */}
      <div className={styles.metricsGrid}>
        {metricsDisplay.map((metric, i) => {
          // Busca a configuração de ícone/cor pelo índice.
          // ?? METRIC_CONFIG[0] evita erro se houver mais de 4 métricas.
          const { Icon, iconColor, iconBg } = METRIC_CONFIG[i] ?? METRIC_CONFIG[0];
          return (
            <div key={metric.id} className={styles.metricCard}>
              <div className={styles.metricTop}>
                {/* Ícone com cor e fundo personalizados via style inline */}
                <div className={styles.metricIcon} style={{ backgroundColor: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <span className={styles.metricValue}>{metric.value}</span>
              </div>
              <p className={styles.metricLabel}>{metric.label}</p>
              <div className={styles.metricFooter}>
                {/* Renderiza seta para cima ou para baixo conforme trendUp */}
                {metric.trendUp
                  ? <TrendingUp size={13} className={styles.trendUp} />
                  : <TrendingDown size={13} className={styles.trendDown} />
                }
                <span className={styles.trend}>{metric.trend}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Lista de feedbacks recentes */}
        <div className={styles.feedbackSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Sugestões e Denúncias Recentes</h2>
          </div>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback) => (
              // FeedbackCard: componente reutilizável que exibe um feedback.
              // onClick navega para /sugestoes com o ID como query param,
              // permitindo que a página de Sugestões abra o item diretamente.
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onClick={() => navigate(`/sugestoes?id=${feedback.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* ── Grade de conteúdo: gráfico + feedbacks ───────────────
          styles.contentGrid → layout side-by-side (ex: 60% / 40%) */}
      <div className={styles.contentGrid}>

        {/* Gráfico de barras (recharts) */}
        <div className={styles.chartCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Caronas por Dia da Semana</h2>
            <span className={styles.badge}>Últimos 7 dias</span>
          </div>
          {/* ResponsiveContainer: faz o gráfico ocupar 100% da largura
              disponível, adaptando-se ao tamanho da tela. */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              {/* defs + linearGradient: cria um degradê do topo (opaco)
                  até a base (transparente) para preencher a área da curva.
                  O id "ridesGradient" é referenciado abaixo em fill="url(#...)". */}
              <defs>
                <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="30%" stopColor="var(--btn-primary-bg)" stopOpacity={100} />
                  <stop offset="100%" stopColor="var(--btn-primary-bg)" stopOpacity={1} />
                </linearGradient>
              </defs>
              {/* Grade de linhas de fundo (só horizontal, sem vertical) */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              {/* Eixo X: usa o campo "day" de chartData como rótulo */}
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              {/* Eixo Y: valores numéricos (quantidade de caronas) */}
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              {/* Tooltip customizado: usa nosso componente ChartTooltip.
                  cursor: linha vertical pontilhada acompanhando o mouse. */}
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
              />
              {/* Área: usa o campo "rides" de chartData como altura da curva.
                  type="monotone" → curva suave passando pelos pontos
                  stroke → cor da linha superior da área
                  fill="url(#ridesGradient)" → aplica o degradê definido em <defs>
                  activeDot → ponto destacado ao passar o mouse */}
              <Area
                type="monotone"
                dataKey="rides"
                stroke="transparent"
                strokeWidth={2}
                fill="url(#ridesGradient)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        

      </div>
    </div>
  );
}
