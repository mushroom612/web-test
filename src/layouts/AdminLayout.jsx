// ============================================================
// layouts/AdminLayout.jsx — Layout para páginas internas
//
// Este é o layout usado em TODAS as páginas autenticadas
// (Dashboard, Usuários, Caronas, etc.).
//
// Estrutura visual:
//   ┌──────────┬───────────────────────────────┐
//   │          │         Topbar                │
//   │  Aside   ├───────────────────────────────┤
//   │ (menu    │                               │
//   │ lateral) │    Conteúdo da página atual   │
//   │          │    (vem do <Outlet />)        │
//   │          │                               │
//   └──────────┴───────────────────────────────┘
//
// Componentes usados aqui:
//   - <Aside />   → menu lateral de navegação (Aside.jsx)
//   - <Topbar />  → barra superior com título e ações (Topbar.jsx)
//   - <Outlet />  → conteúdo da página atual (ex: Painel)
//
// Biblioteca usada: react-router-dom
//   - Outlet → espaço onde a página filha é renderizada.
//     Quando a URL é "/painel", o <Outlet /> vira <Painel />.
//     Quando a URL é "/usuarios", o <Outlet /> vira <Usuarios />.
//     E assim por diante para todas as rotas filhas de AdminLayout.
//
// Estilo: AdminLayout.module.css
// ============================================================

import { Outlet } from "react-router-dom";
import { Aside } from "../components/Aside";
import { Topbar } from "../components/Topbar";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  return (
    // Container principal: organiza Aside e mainArea lado a lado
    // (provavelmente usando display: flex no CSS)
    <div className={styles.container}>
      {/* Menu lateral fixo à esquerda.
          Definido em src/components/Aside.jsx */}
      <Aside />

      {/* Área principal à direita do menu */}
      <div className={styles.mainArea}>
        {/* Barra superior com título da página atual,
            ícone de notificações e botão de logout.
            Definido em src/components/Topbar.jsx */}
        <Topbar />

        {/* Área de conteúdo: aqui o React Router injeta
            automaticamente a página correspondente à URL.
            Ex: /painel  → <Painel />
                /caronas   → <Caronas />    */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
