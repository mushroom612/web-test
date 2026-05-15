/**
 * ============================================================================
 * ARQUIVO: src/layouts/AdminLayout.jsx
 * DESCRIÇÃO: Layout principal para páginas autenticadas (com sidebar + header)
 *
 * Este layout envolve todas as páginas do painel administrativo com:
 * - Aside (sidebar esquerda): Menu de navegação
 * - Topbar (header superior): Titulo da página, notificações, usuário
 * - Outlet: Espaço onde a página atual é renderizada
 *
 * Estrutura visual:
 * ┌──────────────────────────────────────────────┐
 * │ Topbar (header)                              │
 * ├──────┬──────────────────────────────────────┤
 * │      │                                       │
 * │      │ Outlet (página atual)                │
 * │ Aside│                                       │
 * │      │                                       │
 * └──────┴──────────────────────────────────────┘
 *
 * Fluxo:
 * 1. Router detecta URL /dashboard
 * 2. AdminLayout é renderizado
 * 3. Outlet renderiza Dashboard (a página)
 * 4. Tudo fica envolvido com Aside + Topbar
 *
 * Interligação:
 * - Usado por: router/routes.jsx (AdminLayout envolve todas as páginas)
 * - Usa: Aside.jsx (menu), Topbar.jsx (header)
 * - CSS: AdminLayout.module.css (estilos)
 * ============================================================================
 */

// Importa Outlet do React Router
// Outlet: renderiza a página filha no lugar indicado
import { Outlet } from "react-router-dom";

// Importa o componente Aside (sidebar com menu)
import { Aside } from "../components/Aside";

// Importa o componente Topbar (header superior)
import { Topbar } from "../components/Topbar";

// Importa os estilos CSS do layout
import styles from "./AdminLayout.module.css";

/**
 * Componente AdminLayout
 *
 * Renderiza o layout da área administrativa
 * @returns JSX com a estrutura de 3 colunas (Aside, Header, Conteúdo)
 */
export function AdminLayout() {
  return (
    // Container principal com classe que define o layout (flexbox, grid, etc)
    <div className={styles.container}>
      {/* Sidebar esquerda com menu de navegação */}
      <Aside />

      {/* Área principal (direita) com header e conteúdo */}
      <div className={styles.mainArea}>
        {/* Header superior com título, notificações, usuário */}
        <Topbar />

        {/* Conteúdo principal - aqui vai a página atual */}
        {/* Outlet é substituído pelo componente da página (Dashboard, Usuarios, etc) */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
