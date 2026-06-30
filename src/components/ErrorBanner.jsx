import { IconAlertTriangle, IconAlertCircle } from "@tabler/icons-react";
import styles from "./ErrorBanner.module.css";

/**
 * ErrorBanner — exibe um erro de duas formas:
 *   - Sem title/onRetry: banner inline vermelho (para erros dentro de páginas carregadas)
 *   - Com title e/ou onRetry: card centralizado com ícone e botão de retentar
 *     (para erros que substituem o conteúdo inteiro da página)
 */
export function ErrorBanner({ error, title, onRetry }) {
  if (title || onRetry) {
    return (
      <div className={styles.card}>
        <IconAlertTriangle size={28} className={styles.cardIcon} />
        {title && <p className={styles.cardTitle}>{title}</p>}
        <p className={styles.cardMessage}>{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={styles.retryBtn}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.inline}>
      <IconAlertCircle size={16} />
      <span>{error}</span>
    </div>
  );
}
