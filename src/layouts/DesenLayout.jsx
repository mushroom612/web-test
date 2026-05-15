/**
 * ============================================================================
 * ARQUIVO: src/layouts/DesenLayout.jsx
 * DESCRIÇÃO: Layout para área de desenvolvimento (sidebar + header + conteúdo)
 *
 * Este layout é similar ao AdminLayout
 * Pode ser usado para páginas de desenvolvedor ou para futuras expansões
 *
 * Estrutura:
 * ┌──────────────────────────────────────────────┐
 * │ Topbar (header)                              │
 * ├──────┬────────────────────────────────────── ┤
 * │      │                                       │
 * │      │ Outlet (página atual)                 │
 * │ Aside│                                       │
 * │      │                                       │
 * └──────┴──────────────────────────────────────┘
 *
 * Interligação:
 * - Similar ao AdminLayout.jsx
 * - Usa: Aside.jsx, Topbar.jsx
 * - CSS: DesenLayout.module.css
 * ============================================================================
 */

// Importa Outlet do React Router
// Outlet: renderiza a página filha
import { Outlet } from "react-router-dom";

// Importa o componente Aside (sidebar com menu)
import { Aside } from "../components/Aside";

// Importa o componente Topbar (header superior)
import { Topbar } from "../components/Topbar";

// Importa os estilos CSS do layout
import styles from "./DesenLayout.module.css";

/**
 * Componente DesenLayout
 *
 * Layout para páginas de desenvolvimento
 * @returns JSX com a estrutura de 3 colunas
 */
export function DesenLayout() {
  return (
    <div className={styles.container}>
      <Aside />
      <div className={styles.mainArea}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
