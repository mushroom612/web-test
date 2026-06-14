import { IconLoader2 } from '@tabler/icons-react';
import styles from './LoadingSpinner.module.css';

export function LoadingSpinner({ size = 28, text }) {
  return (
    <div className={styles.wrapper}>
      <IconLoader2 size={size} className={styles.spin} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
