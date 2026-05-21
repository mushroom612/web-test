// ============================================================
// router/routes.jsx — Definição de todas as rotas da aplicação
//
// Este arquivo responde à pergunta:
// "Qual página deve aparecer quando o usuário acessa /X ?"
//
// Também controla a proteção de rotas: páginas que só podem
// ser acessadas por usuários já logados.
//
// Biblioteca usada: react-router-dom
//   - Navigate  → redireciona o usuário para outra URL
//   - Outlet    → marca o lugar onde a página filha aparece
//                 dentro de um layout pai
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';

// Layouts: "molduras" visuais que envolvem as páginas.
// AdminLayout  → moldura com menu lateral + barra superior
//                usada em todas as páginas internas.
// PublicLayout → moldura simples, só para a tela de Login.
import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';

// Páginas da aplicação — cada import representa uma tela:
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Usuarios } from '../pages/Usuarios';
import { Caronas } from '../pages/Caronas';
import { Sugestoes } from '../pages/Sugestoes';
import { Relatorios } from '../pages/Relatorios';
import { Cadastrar } from '../pages/Cadastrar';
import { Contratos } from '../pages/Contratos';
import { Notificacoes } from '../pages/Notificacoes';
import { Auditoria } from '../pages/Auditoria';

// ── Guarda de rota (proteção de acesso) ───────────────────────
// PrivateRoute: componente que funciona como um "porteiro".
// Antes de mostrar a página, ele verifica se o usuário está
// logado, checando se existe um token salvo no localStorage.
//
// localStorage → armazenamento do navegador que persiste
// dados mesmo após fechar a aba (como cookies, mas em JS).
//
// Se tiver token  → deixa passar (<Outlet /> renderiza a rota filha)
// Se não tiver    → redireciona para "/" (tela de Login)
// O "replace" evita que o usuário volte para a rota proibida
// usando o botão "voltar" do navegador.
function PrivateRoute() {
  const token = localStorage.getItem('auth_token');
  return token ? <Outlet /> : <Navigate to="/" replace />;
}

// ── Array de rotas ─────────────────────────────────────────────
// Exportado como "routes" e consumido pelo App.jsx via useRoutes.
//
// A estrutura é em árvore (rotas aninhadas / nested routes):
//
//  routes
//  ├── PublicLayout          ← moldura pública
//  │   └── "/"  → <Login />
//  │
//  └── PrivateRoute          ← porteiro: verifica login
//      └── AdminLayout       ← moldura com menu + topbar
//          ├── "/dashboard"  → <Dashboard />
//          ├── "/usuarios"   → <Usuarios />
//          ├── "/cadastrar"  → <Cadastrar />
//          ├── "/caronas"    → <Caronas />
//          ├── "/sugestoes"  → <Sugestoes />
//          ├── "/relatorios" → <Relatorios />
//          ├── "/contratos"  → <Contratos />
//          ├── "/notificacoes" → <Notificacoes />
//          └── "/auditoria"  → <Auditoria />
//
// Como funciona o aninhamento:
//   O componente pai (ex: AdminLayout) renderiza <Outlet />,
//   que é substituído automaticamente pelo componente filho
//   correspondente à URL atual.
export const routes = [
  {
    // Grupo público: não precisa de login
    element: <PublicLayout />,
    children: [
      {
        path: '/',         // URL raiz → mostra o Login
        element: <Login />
      }
    ]
  },
  {
    // Grupo privado: o PrivateRoute verifica o token antes
    // de renderizar qualquer coisa dentro deste grupo
    element: <PrivateRoute />,
    children: [
      {
        // AdminLayout envolve todas as páginas internas
        // com o menu lateral (Aside) e a barra superior (Topbar)
        element: <AdminLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />
          },
          {
            path: '/usuarios',
            element: <Usuarios />
          },
          {
            path: '/cadastrar',
            element: <Cadastrar />
          },
          {
            path: '/caronas',
            element: <Caronas />
          },
          {
            path: '/sugestoes',
            element: <Sugestoes />
          },
          {
            path: '/relatorios',
            element: <Relatorios />
          },
          {
            path: '/contratos',
            element: <Contratos />
          },
          {
            path: '/notificacoes',
            element: <Notificacoes />
          },
          {
            path: '/auditoria',
            element: <Auditoria />
          },
        ]
      }
    ]
  }
];
