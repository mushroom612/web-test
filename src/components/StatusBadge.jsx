import styles from './StatusBadge.module.css';

export function StatusBadge({ status, type = 'status' }) {
  const statusStyles = {
    'Ativo': { bg: '#e9f5df', text: '#2d5016' },
    'Inativo': { bg: '#fee2e2', text: '#b91c1c' },
    'Pendente': { bg: '#fef3c7', text: '#92400e' },
    'Concluída': { bg: '#d1fae5', text: '#047857' },
    'Em andamento': { bg: '#dbeafe', text: '#0369a1' },
    'Cancelada': { bg: '#fee2e2', text: '#b91c1c' },
    'Sugestão': { bg: '#e9f5df', text: '#2d5016' },
    'Denúncia': { bg: '#fee2e2', text: '#b91c1c' },
    'Resolvido': { bg: '#d1fae5', text: '#047857' },
    'Arquivado': { bg: '#ede9fe', text: '#5b21b6' }
  };

  const style = statusStyles[status] || statusStyles['Pendente'];

  return (
    <span
      className={styles.badge}
      style={{
        backgroundColor: style.bg,
        color: style.text
      }}
    >
      {status}
    </span>
  );
}
