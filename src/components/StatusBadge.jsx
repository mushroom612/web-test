// ============================================================
// components/StatusBadge.jsx — Badge colorido reutilizável de status
//
// Exibe um pequeno "chip" (etiqueta) colorido com o texto do status.
// É usado em várias páginas do painel para mostrar o estado de:
//   - Usuários: Ativo / Inativo / Suspenso
//   - Caronas: Aberta / Em espera / Concluída / Cancelada
//   - Sugestões: Pendente / Em análise / Resolvido / Arquivado
//   - Contratos: Ativo / Vencido / Pendente de Assinatura
//
// Interligação:
//   - Importado por: Dashboard.jsx, Caronas.jsx, Sugestoes.jsx,
//     Contratos.jsx, FeedbackCard.jsx, PenaltyPanel.jsx, Usuarios.jsx
//
// Props (parâmetros recebidos pelo componente):
//   status → string com o texto a exibir (ex: 'Ativo', 'Cancelada')
//   type   → não usado visualmente hoje, mas previsto para extensões futuras
//
// Estilo: StatusBadge.module.css
//   Classes CSS utilizadas:
//     .badge → aplica bordas arredondadas, padding e tamanho de fonte
//              As cores de fundo e texto são definidas via `style` inline,
//              não por classes CSS, pois variam por status.
//
// Como funciona a coloração:
//   O objeto `statusStyles` mapeia cada texto de status para um par de cores:
//     bg   → cor de fundo (ex: verde claro para 'Ativo')
//     text → cor do texto (ex: verde escuro para 'Ativo')
//   Se o status não estiver no mapa, usa as cores de 'Pendente' como padrão.
// ============================================================

import styles from './StatusBadge.module.css';

export function StatusBadge({ status, type = 'status' }) {
  // statusStyles: dicionário que associa cada texto de status a um par de cores.
  // As cores seguem uma convenção semântica:
  //   verde  → positivo (Ativo, Concluída, Resolvido, Sugestão)
  //   azul   → neutro/informativo (Aberta, Em andamento)
  //   amarelo → atenção (Pendente, Em análise, Em espera)
  //   vermelho → negativo (Inativo, Cancelada, Denúncia, Vencido, Suspenso)
  //   roxo   → especial (Arquivado)
  const statusStyles = {
    'Ativo': { bg: '#e9f5df', text: '#2d5016' },
    'Inativo': { bg: '#fee2e2', text: '#b91c1c' },
    'Pendente': { bg: '#fef3c7', text: '#92400e' },
    'Concluída': { bg: '#d1fae5', text: '#047857' },
    'Em andamento': { bg: '#dbeafe', text: '#0369a1' },
    'Cancelada': { bg: '#fee2e2', text: '#b91c1c' },
    'Sugestão': { bg: '#e9f5df', text: '#2d5016' },
    'Denúncia': { bg: '#fee2e2', text: '#b91c1c' },
    'Resolvido': { bg: '#d1fae5', text: '#047857' },
    'Arquivado': { bg: '#ede9fe', text: '#5b21b6' },
    'Aberta': { bg: '#dbeafe', text: '#0369a1' },
    'Em espera': { bg: '#fef3c7', text: '#92400e' },
    'Aberto': { bg: '#dbeafe', text: '#0369a1' },
    'Em análise': { bg: '#fef3c7', text: '#92400e' },
    'Aguardando verificação': { bg: '#fef3c7', text: '#92400e' },
    'Suspenso': { bg: '#fee2e2', text: '#b91c1c' },
    'Temporário': { bg: '#fef3c7', text: '#92400e' },
    'Vencido': { bg: '#fee2e2', text: '#b91c1c' },
    'Pendente de Assinatura': { bg: '#fef3c7', text: '#92400e' }
  };

  // Busca as cores pelo status; se não encontrar, usa as cores de 'Pendente' como fallback
  const style = statusStyles[status] || statusStyles['Pendente'];

  return (
    // styles.badge → aplica o formato visual base (bordas, padding, fonte).
    // style={{ ... }} → injeta as cores diretamente no elemento HTML
    //   (backgroundColor e color mudam por status, por isso usamos style inline
    //   em vez de classes CSS separadas para cada status).
    <span
      className={styles.badge}
      style={{
        backgroundColor: style.bg,
        color: style.text
      }}
    >
      {status}
    </span>
  );
}
