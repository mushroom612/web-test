import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import styles from './Pagination.module.css';

/**
 * Pagination — controles de navegação entre páginas.
 *   page       → página atual (começa em 1)
 *   totalPages → total de páginas
 *   total      → total de registros (para exibir o contador)
 *   itemLabel  → rótulo no singular (ex: "usuário", "carona", "registro")
 *   onPrevious → callback chamado ao clicar em "Anterior"
 *   onNext     → callback chamado ao clicar em "Próximo"
 *   compact    → versão reduzida para painéis com pouco espaço (Caronas)
 */
export function Pagination({ page, totalPages, total, itemLabel = 'item', onPrevious, onNext, compact = false }) {
  const plural = total !== 1 ? 's' : '';

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      <span className={styles.info}>
        Página {page} de {totalPages} · {total} {itemLabel}{plural}
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={onPrevious}
          disabled={page === 1}
        >
          <IconChevronLeft size={compact ? 13 : 15} />
          {compact ? 'Ant.' : 'Anterior'}
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={onNext}
          disabled={page === totalPages}
        >
          {compact ? 'Prox.' : 'Próximo'}
          <IconChevronRight size={compact ? 13 : 15} />
        </button>
      </div>
    </div>
  );
}
