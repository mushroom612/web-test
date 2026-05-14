import { useState, useEffect } from 'react';
import { Users, Car, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { metricsData, feedbacksData, chartData } from '../data/mockData';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Dashboard.module.css';

function formatSugestao(s) {
  return {
    id: s.sug_id,
    userName: s.usu_nome || `Usuário #${s.usu_id}`,
    avatar: (s.usu_nome || 'U').charAt(0).toUpperCase(),
    text: s.sug_texto,
    type: s.sug_tipo === 1 ? 'Denúncia' : 'Sugestão',
    status: s.sug_status === 1 ? 'Resolvido'
      : s.sug_status === 2 ? 'Em análise'
      : 'Pendente',
    date: new Date(s.criado_em).toLocaleDateString('pt-BR')
  };
}

const METRIC_CONFIG = [
  { Icon: Users,        iconColor: '#3b82f6', iconBg: '#dbeafe' },
  { Icon: Car,          iconColor: '#8b5cf6', iconBg: '#ede9fe' },
  { Icon: CheckCircle,  iconColor: '#22c55e', iconBg: '#dcfce7' },
  { Icon: AlertCircle,  iconColor: '#f59e0b', iconBg: '#fef3c7' }
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value} caronas</p>
    </div>
  );
}

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [feedbacks, setFeedbacks] = useState(feedbacksData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
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
        // mantém mock
      }

      try {
        const data = await api.getSugestoes();
        const lista = data.sugestoes || data.data || [];
        if (lista.length > 0) {
          setFeedbacks(lista.slice(0, 4).map(formatSugestao));
        }
      } catch {
        // mantém mock
      }

      setLoading(false);
    }
    load();
  }, []);

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
    : metricsData;

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingWrap}>
          <Loader2 size={32} className={styles.spin} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Visão geral da plataforma CaronaCity</p>
      </div>

      {/* Metric cards */}
      <div className={styles.metricsGrid}>
        {metricsDisplay.map((metric, i) => {
          const { Icon, iconColor, iconBg } = METRIC_CONFIG[i] ?? METRIC_CONFIG[0];
          return (
            <div key={metric.id} className={styles.metricCard}>
              <div className={styles.metricTop}>
                <div className={styles.metricIcon} style={{ backgroundColor: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <span className={styles.metricValue}>{metric.value}</span>
              </div>
              <p className={styles.metricLabel}>{metric.label}</p>
              <div className={styles.metricFooter}>
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

      {/* Content grid */}
      <div className={styles.contentGrid}>

        {/* Bar chart */}
        <div className={styles.chartCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Caronas por Dia da Semana</h2>
            <span className={styles.badge}>Últimos 7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar
                dataKey="rides"
                fill="var(--btn-primary-bg)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent feedback */}
        <div className={styles.feedbackSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Sugestões e Denúncias Recentes</h2>
          </div>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
