import { StatusBadge } from './StatusBadge';
import styles from './FeedbackCard.module.css';

export function FeedbackCard({ feedback }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <span className={styles.avatar}>{feedback.avatar}</span>
          <div className={styles.details}>
            <p className={styles.name}>{feedback.userName}</p>
            <span className={styles.date}>{feedback.date}</span>
          </div>
        </div>
        <StatusBadge status={feedback.type} />
      </div>
      <p className={styles.text}>{feedback.text}</p>
    </div>
  );
}
