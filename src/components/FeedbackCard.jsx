/**
 * ============================================================================
 * ARQUIVO: src/components/FeedbackCard.jsx
 * DESCRIÇÃO: Componente que exibe um card de sugestão ou denúncia
 *
 * Este é um exemplo de componente reutilizável:
 * - Recebe dados como props
 * - Renderiza UI consistente
 * - Pode ser clicado para fazer algo
 *
 * Props recebidas:
 * - feedback: objeto com {avatar, userName, date, type, text}
 * - onClick: função executada quando o card é clicado
 *
 * Como é usado:
 * - Dashboard.jsx renderiza vários FeedbackCard
 * - Cada card clicável navega para /sugestoes
 *
 * Conceitos:
 * - Props: dados passados do componente pai
 * - className condicional: muda classe baseado em props
 * - onClick: função executada ao clicar
 * ============================================================================
 */

// Importa componente reutilizável para mostrar status
// StatusBadge: pequeno badge colorido com texto (ex: "Sugestão", "Denúncia")
import { StatusBadge } from "./StatusBadge";

// Importa estilos CSS
import styles from "./FeedbackCard.module.css";

/**
 * Componente FeedbackCard
 *
 * Renderiza um card que mostra feedback de um usuário
 *
 * @param {Object} feedback - dados do feedback
 * @param {string} feedback.avatar - emoji/inicial do usuário
 * @param {string} feedback.userName - nome do usuário
 * @param {string} feedback.date - data do feedback
 * @param {string} feedback.type - "Sugestão" ou "Denúncia"
 * @param {string} feedback.text - texto do feedback
 * @param {Function} onClick - função chamada ao clicar no card
 * @returns {JSX} - Card renderizado
 */
export function FeedbackCard({ feedback, onClick }) {
  return (
    <div
      // className: adiciona classe 'cardClickable' se onClick existe (muda cursor)
      className={`${styles.card} ${onClick ? styles.cardClickable : ""}`}
      // onClick: função executada quando o card é clicado
      onClick={onClick}
    >
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* HEADER: Avatar, nome, data, tipo */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        {/* Informações do usuário */}
        <div className={styles.userInfo}>
          {/* Avatar (emoji) do usuário */}
          <span className={styles.avatar}>{feedback.avatar}</span>

          {/* Nome e data */}
          <div className={styles.details}>
            <p className={styles.name}>{feedback.userName}</p>
            <span className={styles.date}>{feedback.date}</span>
          </div>
        </div>

        {/* Badge de status (Sugestão ou Denúncia) */}
        <StatusBadge status={feedback.type} />
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TEXTO DO FEEDBACK */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <p className={styles.text}>{feedback.text}</p>
    </div>
  );
}
