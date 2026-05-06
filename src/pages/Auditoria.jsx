import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { auditLogData } from '../data/mockData';
import styles from './Auditoria.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getLogs({ limit: 50 })
      .then((data) => {
        const lista = data.logs || [];
        setLogs(lista);
      })
      .catch((err) => {
        if (err.message.includes('403') || err.message.toLowerCase().includes('não autorizado')) {
          setError('O log de auditoria é restrito a desenvolvedores (role 2).');
        } else {
          setLogs(auditLogData.map((l) => ({
            audit_id: l.id,
            criado_em: l.date,
            usu_id: l.admin,
            acao: l.action,
            tabela: l.description,
            ip: l.ip
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Auditoria</h1>
        <p className={styles.subtitle}>Log de Ações Administrativas</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '2rem', color: '#b91c1c', background: '#fee2e2', borderRadius: '8px', margin: '1rem 0' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Admin (ID)</th>
                <th>Ação</th>
                <th>Tabela / Descrição</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.audit_id} className={index % 2 === 0 ? styles.rowEven : ''}>
                  <td className={styles.cellDateTime}>{formatDate(log.criado_em)}</td>
                  <td className={styles.cellAdmin}>{log.usu_id ?? '—'}</td>
                  <td>
                    <span className={styles.actionBadge}>{log.acao}</span>
                  </td>
                  <td className={styles.cellDescription}>{log.tabela}</td>
                  <td className={styles.cellIP}>
                    <code className={styles.ipCode}>{log.ip || '—'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Nenhum registro encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
