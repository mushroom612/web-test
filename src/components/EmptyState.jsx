import styles from "./EmptyState.module.css";

/**
 * EmptyState — exibido quando uma lista não tem itens.
 *   icon        → componente de ícone (ex: IconCar)
 *   title       → texto principal (ex: "Nenhuma carona encontrada.")
 *   description → texto secundário opcional
 *   action      → botão CTA opcional: { label: string, onClick: fn }
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={styles.wrapper}>
      {Icon && <Icon size={40} className={styles.icon} />}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={styles.actionBtn}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
