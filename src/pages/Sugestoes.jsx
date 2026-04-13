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
        {['Todos', 'Sugestões', 'Denúncias'].map((type) => (
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
              <StatusBadge status={item.type} />
            </div>
            <p className={styles.text}>{item.text}</p>
            <div className={styles.cardFooter}>
              <StatusBadge status={item.status} />
              <div className={styles.actions}>
                <button className={styles.secondaryBtn}>Resolver</button>
                <button className={styles.secondaryBtn}>Arquivar</button>
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
