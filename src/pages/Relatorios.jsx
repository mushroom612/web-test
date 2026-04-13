import { Download, Users, Car, AlertCircle, BarChart2 } from 'lucide-react';
import { reportsData, recentReports } from '../data/mockData';
import styles from './Relatorios.module.css';

export function Relatorios() {
  const iconMap = {
    Users: <Users size={32} />,
    Car: <Car size={32} />,
    AlertCircle: <AlertCircle size={32} />,
    BarChart2: <BarChart2 size={32} />
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
      </div>

      <div className={styles.reportsGrid}>
        {reportsData.map((report) => (
          <div key={report.id} className={styles.reportCard}>
            <div className={styles.iconWrapper}>
              {iconMap[report.icon]}
            </div>
            <h3 className={styles.reportTitle}>{report.title}</h3>
            <p className={styles.reportDescription}>{report.description}</p>
            <div className={styles.reportActions}>
              <button className={styles.primaryBtn}>Gerar</button>
              <button className={styles.ghostBtn}>Gerar com IA</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Relatórios Gerados Recentemente</h2>

        <div className={styles.reportsList}>
          {recentReports.map((report) => (
            <div key={report.id} className={styles.reportItem}>
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
