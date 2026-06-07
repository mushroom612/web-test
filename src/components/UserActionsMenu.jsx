// ============================================================
// components/UserActionsMenu.jsx — Menu suspenso de ações por linha (⋮)
//
// Exibe um botão "⋮" que ao ser clicado abre um menu com ações
// disponíveis para o usuário da linha: Ver Detalhes, Editar,
// Penalizar, Desativar/Reativar.
//
// O menu usa position: fixed com coordenadas calculadas via
// getBoundingClientRect() para escapar de qualquer overflow:hidden
// presente nos ancestrais (ex: tableWrapper). Fecha automaticamente
// ao rolar a página ou redimensionar a janela.
//
// Props:
//   user           → objeto do usuário desta linha
//   onEdit         → função chamada ao clicar "Editar"
//   onPenalize     → função chamada ao clicar "Penalizar"
//   onView         → função chamada ao clicar "Ver Detalhes"
//   onToggleStatus → função chamada ao clicar Desativar/Reativar
//                    (undefined = opção oculta)
//
// Estilo: UserActionsMenu.module.css
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Edit2, ShieldAlert, Eye, UserX, UserCheck } from "lucide-react";
import styles from "./UserActionsMenu.module.css";

export function UserActionsMenu({ user, onEdit, onPenalize, onView, onToggleStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  // Fecha o menu ao rolar ou redimensionar — necessário porque o menu
  // usa position: fixed e não acompanha o scroll da página automaticamente.
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  function handleOpen() {
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top:   rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setIsOpen(v => !v);
  }

  return (
    <div className={styles.container}>
      <button
        ref={btnRef}
        className={styles.menuBtn}
        onClick={handleOpen}
        title="Mais opções"
      >
        ⋮
      </button>

      {isOpen && (
        <>
          {/* Overlay invisível cobre a tela toda para capturar cliques fora */}
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />

          {/* Menu com position: fixed — posicionado via inline style calculado
              a partir do getBoundingClientRect() do botão ⋮ */}
          <div
            className={styles.menu}
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              className={styles.menuItem}
              onClick={() => { onView?.(user); setIsOpen(false); }}
            >
              <Eye size={16} />
              Ver Detalhes
            </button>

            <button
              className={styles.menuItem}
              onClick={() => { onEdit?.(user); setIsOpen(false); }}
            >
              <Edit2 size={16} />
              Editar
            </button>

            <button
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={() => { onPenalize?.(user); setIsOpen(false); }}
            >
              <ShieldAlert size={16} />
              Penalizar
            </button>

            {onToggleStatus && (
              <button
                className={`${styles.menuItem} ${user.usu_status === 1 ? styles.danger : ''}`}
                onClick={() => { onToggleStatus(user); setIsOpen(false); }}
              >
                {user.usu_status === 1
                  ? <><UserX size={16} /> Desativar</>
                  : <><UserCheck size={16} /> Reativar</>}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
