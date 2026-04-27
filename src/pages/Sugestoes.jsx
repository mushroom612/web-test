import { useState } from 'react';
import { suggestionsData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Sugestoes.module.css';

export function Sugestoes() {
  const [filterType, setFilterType] = useState('Todos');

  const filteredSuggestions = suggestionsData.filter(
    (item) => filterType === 'Todos' || item.type === filterType
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sugestões e Denúncias</h1>
      </div>

      <div className={styles.filterTabs}>
        {['Todos', 'Sugestão', 'Denúncia'].map((type) => (
          <button
            key={type}
            className={`${styles.filterBtn} ${filterType === type ? styles.active : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filteredSuggestions.map((item) => (
          <div key={item.id} className={styles.suggestionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.userInfo}>
                <span className={styles.avatar}>{item.avatar}</span>
                <div className={styles.details}>
                  <p className={styles.name}>{item.userName}</p>
                  <span className={styles.date}>{item.date}</span>
                </div>
              </div>
              <div className={styles.typeAndStatus}>
                <StatusBadge status={item.type} />
                <StatusBadge status={item.status} />
              </div>
            </div>
            <p className={styles.text}>{item.text}</p>
            {item.response && (
              <div className={styles.responseSection}>
                <p className={styles.responseLabel}>Resposta do Admin:</p>
                <p className={styles.responseText}>{item.response}</p>
              </div>
            )}
            <div className={styles.cardFooter}>
              <div className={styles.actions}>
                <button className={styles.secondaryBtn}>Editar</button>
                <button className={styles.secondaryBtn}>Responder</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhuma sugestão ou denúncia encontrada.</p>
        </div>
      )}
    </div>
  );
}
