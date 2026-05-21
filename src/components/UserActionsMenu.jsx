// ============================================================
// components/UserActionsMenu.jsx — Menu suspenso de ações por linha (⋮)
//
// Exibe um botão "⋮" (três pontos verticais) que ao ser clicado abre
// um pequeno menu com ações disponíveis para um usuário da tabela:
//   - Ver Detalhes → abre UserProfilePanel no modo visualização
//   - Editar        → abre UserProfilePanel no modo edição
//   - Penalizar     → abre PenaltyPanel
//   - Deletar       → chama handleDeleteUser com confirmação
//
// Como funciona o fechamento automático ao clicar fora:
//   Um <div className={styles.overlay}> invisível cobre toda a tela
//   quando o menu está aberto. Ao clicar em qualquer lugar fora do menu,
//   esse overlay captura o clique e chama setIsOpen(false).
//   Isso é um padrão comum em menus dropdown no React.
//
// Interligação:
//   - Importado por: Usuarios.jsx (na coluna de ações de cada linha da tabela)
//   - Abre: UserProfilePanel (via onView/onEdit), PenaltyPanel (via onPenalize)
//   - Lucide React: Edit2, ShieldAlert, Trash2, Eye
//
// Props (parâmetros recebidos pelo componente):
//   user      → objeto do usuário desta linha (passado para os handlers)
//   onEdit    → função chamada ao clicar "Editar" (recebe o user)
//   onPenalize → função chamada ao clicar "Penalizar" (recebe o user)
//   onDelete  → função chamada ao clicar "Deletar" (recebe o user)
//   onView    → função chamada ao clicar "Ver Detalhes" (recebe o user)
//
// Estilo: UserActionsMenu.module.css
//   Classes CSS utilizadas:
//     .container  → div raiz com position: relative (para o menu se posicionar
//                   corretamente em relação ao botão ⋮)
//     .menuBtn    → botão "⋮" que abre/fecha o menu
//     .overlay    → div invisível que cobre a tela toda para capturar cliques
//                   fora do menu e fechá-lo automaticamente
//     .menu       → caixa branca com sombra que aparece ao clicar em ⋮
//     .menuItem   → botão de cada item do menu (ícone + texto)
//     .danger     → cor vermelha para ações destrutivas (Penalizar, Deletar)
//     .divider    → linha separadora horizontal entre itens do menu
// ============================================================

import {useState} from "react";
import {Edit2, ShieldAlert, Trash2, Eye} from "lucide-react";
import styles from "./UserActionsMenu.module.css";

export function UserActionsMenu({user, onEdit, onPenalize, onView}) {
  // isOpen: controla se o menu está visível ou oculto
  const [isOpen, setIsOpen] = useState(false);

  return (
    // styles.container → position: relative necessário para que o menu
    // (.menu) se posicione em relação a este elemento pai
    <div className={styles.container}>
      {/* Botão de três pontos: alterna o estado de aberto/fechado */}
      <button
        className={styles.menuBtn}
        onClick={() => setIsOpen(!isOpen)}  // ! inverte: se true vira false e vice-versa
        title="Mais opções"
      >
        ⋮
      </button>

      {/* Renderização condicional: só exibe o menu e o overlay quando isOpen é true */}
      {isOpen && (
        // Fragment (<>) → renderiza dois elementos sem div extra
        <>
          {/* Overlay invisível: cobre toda a tela abaixo do menu.
              Ao clicar nele, fecha o menu. Isso simula o comportamento
              de "clicar fora" sem precisar de event listeners globais. */}
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu suspenso com as opções */}
          <div className={styles.menu}>

            {/* Ver Detalhes: chama onView com o usuário e fecha o menu.
                onView?.(user) → o ?. (optional chaining) evita erro se onView
                não for fornecido (o componente funciona mesmo sem esta prop) */}
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

            {/* styles.danger → texto e ícone em vermelho para ação de penalizar */}
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
          </div>
        </>
      )}
    </div>
  );
}
