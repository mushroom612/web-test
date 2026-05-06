import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { metricsData, feedbacksData } from '../data/mockData';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Dashboard.module.css';

function formatSugestao(s) {
  return {
    id: s.sug_id,
    userName: s.usu_nome || `Usuário #${s.usu_id}`,
    avatar: (s.usu_nome || 'U').charAt(0).toUpperCase(),
    text: s.sug_texto,
    type: s.sug_tipo === 'denuncia' ? 'Denúncia' : 'Sugestão',
    status: s.sug_status === 'aberta' ? 'Pendente'
      : s.sug_status === 'em_analise' ? 'Em análise'
      : 'Resolvido',
    date: new Date(s.criado_em).toLocaleDateString('pt-BR')
  };
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
        // sem acesso às stats — mantém mock
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
          trendUp: true,
          trend: `${metrics.usuarios.ativos} ativos`
        },
        {
          id: 2,
          label: 'Total de Caronas',
          value: metrics.caronas.total,
          trendUp: true,
          trend: `${metrics.caronas.abertas} abertas`
        },
        {
          id: 3,
          label: 'Caronas Finalizadas',
          value: metrics.caronas.finalizadas,
          trendUp: true,
          trend: 'realizadas com sucesso'
        },
        {
          id: 4,
          label: 'Sugestões Pendentes',
          value: metrics.sugestoes.abertas,
          trendUp: metrics.sugestoes.abertas === 0,
          trend: `${metrics.sugestoes.total} no total`
        }
      ]
    : metricsData;

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.metricsGrid}>
        {metricsDisplay.map((metric) => (
          <div key={metric.id} className={styles.metricCard}>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{metric.value}</div>
              <p className={styles.metricLabel}>{metric.label}</p>
            </div>
            <div className={styles.metricFooter}>
              {metric.trendUp ? (
                <TrendingUp size={16} className={styles.trendUp} />
              ) : (
                <TrendingDown size={16} className={styles.trendDown} />
              )}
              <span className={styles.trend}>{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
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
