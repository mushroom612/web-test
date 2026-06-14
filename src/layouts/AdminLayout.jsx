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

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Aside } from "../components/Aside";
import { Topbar } from "../components/Topbar";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Aside isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={styles.mainArea}>
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
