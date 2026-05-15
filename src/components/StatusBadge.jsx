/**
 * ============================================================================
 * ARQUIVO: src/components/StatusBadge.jsx
 * DESCRIÇÃO: Componente que mostra um badge colorido com status
 *
 * Este é um exemplo perfeito para aprender:
 * - Como usar objetos para mapear valores a dados
 * - Como passar estilos dinamicamente
 * - Como criar componentes muito reutilizáveis
 *
 * Exemplo de uso:
 * - <StatusBadge status="Ativo" /> → badge verde
 * - <StatusBadge status="Inativo" /> → badge vermelho
 * - <StatusBadge status="Pendente" /> → badge amarelo
 *
 * Como funciona:
 * 1. Recebe o status como prop (string)
 * 2. Procura no objeto statusStyles
 * 3. Se encontra → usa cores específicas
 * 4. Se não → usa cores de "Pendente" como padrão
 * 5. Renderiza span com cores inline (style={{ ... }})
 * ============================================================================
 */

// Importa estilos CSS
import styles from "./StatusBadge.module.css";

/**
 * Componente StatusBadge
 *
 * Renderiza um badge colorido baseado no status
 *
 * @param {string} status - o status a exibir
 *   - 'Ativo' → verde
 *   - 'Inativo' → vermelho
 *   - 'Pendente' → amarelo
 *   - 'Sugestão' → verde
 *   - 'Denúncia' → vermelho
 *   - etc
 * @param {string} type - tipo (não usado neste exemplo, deixado para futuro)
 * @returns {JSX} - span com badge
 */
export function StatusBadge({ status, type = "status" }) {
  /**
   * Mapeamento de status para cores
   *
   * Conceito importante: usar um objeto como "mapa"
   * Em vez de fazer:
   *   if (status === 'Ativo') { ... }
   *   else if (status === 'Inativo') { ... }
   *   ...
   *
   * Podemos colocar todos os mapeamentos em um objeto:
   * statusStyles['Ativo'] → retorna {bg, text}
   *
   * Chaves: status em string (ex: 'Ativo')
   * Valores: objeto com {bg: cor de fundo, text: cor de texto}
   *
   * Cores usadas:
   * - Verde (#e9f5df): sucesso, ativo, resolvido
   * - Vermelho (#fee2e2): erro, inativo, cancelado
   * - Amarelo (#fef3c7): aviso, pendente, em análise
   * - Azul (#dbeafe): info, aberto, em andamento
   * - Roxo (#ede9fe): arquivado
   */
  const statusStyles = {
    // Status de usuários
    Ativo: { bg: "#e9f5df", text: "#2d5016" },
    Inativo: { bg: "#fee2e2", text: "#b91c1c" },
    Pendente: { bg: "#fef3c7", text: "#92400e" },
    Suspenso: { bg: "#fee2e2", text: "#b91c1c" },
    Temporário: { bg: "#fef3c7", text: "#92400e" },
    "Aguardando verificação": { bg: "#fef3c7", text: "#92400e" },

    // Status de caronas
    Aberta: { bg: "#dbeafe", text: "#0369a1" },
    Concluída: { bg: "#d1fae5", text: "#047857" },
    Cancelada: { bg: "#fee2e2", text: "#b91c1c" },
    "Em espera": { bg: "#fef3c7", text: "#92400e" },
    "Em andamento": { bg: "#dbeafe", text: "#0369a1" },

    // Status de sugestões/denúncias
    Sugestão: { bg: "#e9f5df", text: "#2d5016" },
    Denúncia: { bg: "#fee2e2", text: "#b91c1c" },
    Resolvido: { bg: "#d1fae5", text: "#047857" },
    "Em análise": { bg: "#fef3c7", text: "#92400e" },

    // Status de contratos
    Arquivado: { bg: "#ede9fe", text: "#5b21b6" },
    Aberto: { bg: "#dbeafe", text: "#0369a1" },
    Vencido: { bg: "#fee2e2", text: "#b91c1c" },
    "Pendente de Assinatura": { bg: "#fef3c7", text: "#92400e" },
  };

  /**
   * Obtém as cores para o status
   *
   * Se o status existe em statusStyles, usa
   * Se não existe, usa 'Pendente' como padrão
   */
  const style = statusStyles[status] || statusStyles["Pendente"];

  // Renderiza o badge
  return (
    <span
      // Classe CSS para estilos base (border-radius, padding, etc)
      className={styles.badge}
      // Estilos inline para cores (variam conforme o status)
      // backgroundColor: cor de fundo
      // color: cor do texto
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {/* Texto do badge (ex: "Ativo", "Pendente", "Denúncia") */}
      {status}
    </span>
  );
}

// Referência de variáveis CSS (não usadas aqui, mas bom para referência):
// --status-success-bg: verde claro
// --status-warning-bg: amarelo claro
// --status-error-bg: vermelho claro
// etc
