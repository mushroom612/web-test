import { TrendingUp, TrendingDown } from 'lucide-react';
import { metricsData, feedbacksData, chartData } from '../data/mockData';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const maxRides = Math.max(...chartData.map(d => d.rides));

  return (
    <div className={styles.dashboard}>
      {/* Seção de Métricas */}
      <div className={styles.metricsGrid}>
        {metricsData.map((metric) => (
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

      {/* Seção de Feedbacks e Estatísticas */}
      <div className={styles.contentGrid}>
       
        <div className={styles.feedbackSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Feedback</h2>
          </div>

          <div className={styles.feedbackList}>
            {feedbacksData.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        </div>

        {/* Coluna de Estatísticas */}
        {/* <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Estatísticas</h2>

          <div className={styles.chart}>
            <div className={styles.chartTitle}>Caronas por Dia (Semana)</div>
            <div className={styles.barContainer}>
              {chartData.map((item, index) => (
                <div key={index} className={styles.barItem}>
                  <div className={styles.barOuter}>
                    <div
                      className={styles.barInner}
                      style={{
                        height: `${(item.rides / maxRides) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className={styles.barLabel}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
