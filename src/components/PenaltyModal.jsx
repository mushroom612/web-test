import {useState} from "react";
import {X, ShieldAlert, Ban, UserX, Clock} from "lucide-react";
import styles from "./PenaltyModal.module.css";

const TIPO_LABELS = {
  1: "Impedimento de oferecer caronas",
  2: "Impedimento de solicitar caronas",
  3: "Impedimento de oferecer e solicitar caronas",
  4: "Suspensão de conta",
};

const TIPO_ICONS = {
  1: ShieldAlert,
  2: ShieldAlert,
  3: Ban,
  4: UserX,
};

const DURACAO_OPTIONS = [
  {value: "1semana", label: "1 semana"},
  {value: "2semanas", label: "2 semanas"},
  {value: "1mes", label: "1 mês"},
  {value: "3meses", label: "3 meses"},
  {value: "6meses", label: "6 meses"},
];

export function PenaltyModal({isOpen, user, onClose, onSubmit}) {
  const [tipoSelecionado, setTipoSelecionado] = useState("1");
  const [duracao, setDuracao] = useState("1semana");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        userId: user.id,
        tipo: tipoSelecionado,
        duracao,
        motivo,
      });

      // Reset form
      setTipoSelecionado("1");
      setDuracao("1semana");
      setMotivo("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Penalizar Usuário</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.userInfo}>
          <span className={styles.avatar}>{user.avatar}</span>
          <div>
            <p className={styles.userName}>{user.name}</p>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tipo de Penalidade */}
          <div className={styles.formGroup}>
            <label htmlFor="tipo" className={styles.label}>
              Tipo de Penalidade
            </label>
            <div className={styles.tiposGrid}>
              {Object.entries(TIPO_LABELS).map(([id, label]) => {
                const Icon = TIPO_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTipoSelecionado(id)}
                    className={`${styles.tipoOption} ${
                      tipoSelecionado === id ? styles.selected : ""
                    }`}
                  >
                    <Icon size={24} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duração */}
          <div className={styles.formGroup}>
            <label htmlFor="duracao" className={styles.label}>
              <Clock size={16} />
              Duração da Penalidade
            </label>
            <select
              id="duracao"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className={styles.select}
            >
              {DURACAO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div className={styles.formGroup}>
            <label htmlFor="motivo" className={styles.label}>
              Motivo da Penalidade
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da penalidade..."
              className={styles.textarea}
              rows={4}
            />
          </div>

          {/* Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !motivo.trim()}
              className={styles.btnSubmit}
            >
              {isSubmitting ? "Penalizando..." : "Aplicar Penalidade"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
