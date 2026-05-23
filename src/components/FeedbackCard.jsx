// Card de feedback (sugestão ou denúncia)
//
// Exibe as informações resumidas de um feedback:
//   - Avatar com a inicial do nome do usuário
//   - Nome do usuário e data de envio
//   - Badge colorido com o tipo (Sugestão / Denúncia)
//   - Texto da mensagem
//
// Interligação:
//   - Importado por: Painel.jsx (exibe os 4 feedbacks mais recentes)
//   - Usa: StatusBadge.jsx (para exibir o tipo como badge colorido)
//
// Props (parâmetros recebidos pelo componente):
//   feedback → objeto com os dados a exibir. Campos esperados:
//     avatar   → string com a letra inicial do nome (ex: 'A')
//     userName → nome completo do usuário
//     date     → data formatada (ex: '20/05/2026')
//     type     → 'Sugestão' ou 'Denúncia' (exibido no StatusBadge)
//     text     → texto da mensagem do feedback
//   onClick → função chamada quando o card é clicado.
//             Se fornecida, aplica styles.cardClickable para mudar o cursor.
//
// Estilo: FeedbackCard.module.css
//   Classes CSS utilizadas:
//     .card          → estrutura base do card (borda, sombra, padding)
//     .cardClickable → adiciona cursor pointer quando o card é clicável
//     .header        → linha superior com avatar + info + badge
//     .userInfo      → agrupa avatar e detalhes de texto lado a lado
//     .avatar        → círculo com a inicial do usuário
//     .details       → coluna com nome e data
//     .name          → nome do usuário (texto maior)
//     .date          → data de envio (texto menor, cinza)
//     .text          → parágrafo com a mensagem do feedback
// ============================================================

import { StatusBadge } from "./StatusBadge";
import styles from "./FeedbackCard.module.css";

export function FeedbackCard({ feedback, onClick }) {
  return (
    // styles.card → estrutura base visual.
    // styles.cardClickable → só aplicado se onClick existir.
    // O operador ternário ${onClick ? styles.cardClickable : ''}
    // adiciona ou omite a classe dinamicamente.
    <div
      className={`${styles.card} ${onClick ? styles.cardClickable : ""}`}
      onClick={onClick}
    >
      {/* Linha de cabeçalho: avatar + nome/data + badge de tipo */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          {/* Avatar: exibe apenas a letra inicial do nome do usuário */}
          <span className={styles.avatar}>{feedback.avatar}</span>
          <div className={styles.details}>
            <p className={styles.name}>{feedback.userName}</p>
            <span className={styles.date}>{feedback.date}</span>
          </div>
        </div>
        {/* StatusBadge: exibe 'Sugestão' (verde) ou 'Denúncia' (vermelho) */}
        <StatusBadge status={feedback.type} />
      </div>
      {/* Texto da mensagem enviada pelo usuário */}
      <p className={styles.text}>{feedback.text}</p>
    </div>
  );
}
