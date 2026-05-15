/**
 * ============================================================================
 * ARQUIVO: src/layouts/PublicLayout.jsx
 * DESCRIÇÃO: Layout para páginas públicas (sem sidebar, sem header)
 *
 * Este layout é usado para páginas que não precisam de autenticação
 *
 * Usado por:
 * - Página de Login (/)
 *
 * Características:
 * - Sem sidebar (Aside)
 * - Sem header (Topbar)
 * - Apenas renderiza a página por si só
 *
 * Interligação:
 * - Usado por: router/routes.jsx (PublicLayout envolve a página de Login)
 * - CSS: PublicLayout.module.css (estilos)
 * ============================================================================
 */

// Importa Outlet do React Router
// Outlet: renderiza a página filha (neste caso, Login)
import { Outlet } from "react-router-dom";

// Importa os estilos CSS do layout
import styles from "./PublicLayout.module.css";

/**
 * Componente PublicLayout
 *
 * Layout simples que apenas envolve a página com um container
 * @returns JSX com um container para a página pública
 */
export function PublicLayout() {
  return (
    <div className={styles.container}>
      {/* Outlet renderiza a página (Login) */}
      <Outlet />
    </div>
  );
}
