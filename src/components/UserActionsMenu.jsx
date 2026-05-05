import {useState} from "react";
import {Edit2, ShieldAlert, Trash2, Eye} from "lucide-react";
import styles from "./UserActionsMenu.module.css";

export function UserActionsMenu({user, onEdit, onPenalize, onDelete, onView}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.menuBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Mais opções"
      >
        ⋮
      </button>

      {isOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
          ></div>
          <div className={styles.menu}>
            <button
              className={styles.menuItem}
              onClick={() => {
                onView?.(user);
                setIsOpen(false);
              }}
            >
              <Eye size={16} />
              Ver Detalhes
            </button>
            <button
              className={styles.menuItem}
              onClick={() => {
                onEdit?.(user);
                setIsOpen(false);
              }}
            >
              <Edit2 size={16} />
              Editar
            </button>
            <button
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={() => {
                onPenalize?.(user);
                setIsOpen(false);
              }}
            >
              <ShieldAlert size={16} />
              Penalizar
            </button>
            <div className={styles.divider}></div>
            <button
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={() => {
                onDelete?.(user);
                setIsOpen(false);
              }}
            >
              <Trash2 size={16} />
              Deletar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
