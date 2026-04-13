import { auditLogData } from '../data/mockData';
import styles from './Auditoria.module.css';

export function Auditoria() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Auditoria</h1>
        <p className={styles.subtitle}>Log de Ações Administrativas</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Admin</th>
              <th>Ação</th>
              <th>Descrição</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {auditLogData.map((log, index) => (
              <tr key={log.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                <td className={styles.cellDateTime}>{log.date}</td>
                <td className={styles.cellAdmin}>{log.admin}</td>
                <td>
                  <span className={styles.actionBadge}>{log.action}</span>
                </td>
                <td className={styles.cellDescription}>{log.description}</td>
                <td className={styles.cellIP}>
                  <code className={styles.ipCode}>{log.ip}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
