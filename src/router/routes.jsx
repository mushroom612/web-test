/**
 * ============================================================================
 * ARQUIVO: src/router/routes.jsx
 * DESCRIÇÃO: Define todas as rotas (URLs) da aplicação
 *
 * As rotas definem:
 * - Qual URL leva a qual página (componente)
 * - Qual layout envolve cada página
 * - Proteção de rotas (precisa estar autenticado para acessar)
 *
 * Estrutura da aplicação:
 * ├─ "/" (Login)                    - Página pública (sem autenticação)
 * └─ ROTAS PROTEGIDAS (com token)
 *    ├─ /dashboard                  - Dashboard (home da aplicação)
 *    ├─ /usuarios                   - Gerenciar usuários
 *    ├─ /cadastrar                  - Cadastrar novo usuário
 *    ├─ /caronas                    - Ver registros de caronas
 *    ├─ /sugestoes                  - Ver sugestões e denúncias
 *    ├─ /relatorios                 - Gerar relatórios
 *    ├─ /contratos                  - Gerenciar contratos
 *    ├─ /notificacoes               - Emitir notificações
 *    └─ /auditoria                  - Ver log de atividades
 *
 * Como funciona:
 * 1. Usuário acessa uma URL (ex: /dashboard)
 * 2. App.jsx usa este arquivo para saber qual página renderizar
 * 3. Se for rota protegida e não tiver token, redireciona para login
 * ============================================================================
 */

// Importa componentes do React Router
// Navigate: componente para redirecionar para outra URL
// Outlet: renderiza a página filha dentro de um layout
import { Navigate, Outlet } from "react-router-dom";

// Importa os layouts (envolvem as páginas com header, sidebar, etc)
import { AdminLayout } from "../layouts/AdminLayout";
import { PublicLayout } from "../layouts/PublicLayout";

// Importa as páginas (componentes que renderizam conteúdo específico)
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Usuarios } from "../pages/Usuarios";
import { Caronas } from "../pages/Caronas";
import { Sugestoes } from "../pages/Sugestoes";
import { Relatorios } from "../pages/Relatorios";
import { Cadastrar } from "../pages/Cadastrar";
import { Contratos } from "../pages/Contratos";
import { Notificacoes } from "../pages/Notificacoes";
import { Auditoria } from "../pages/Auditoria";

/**
 * Componente PrivateRoute
 *
 * Este componente protege as rotas que precisam de autenticação
 *
 * Como funciona:
 * 1. Procura por um token no localStorage
 * 2. Se tiver token → deixa acessar (renderiza Outlet)
 * 3. Se não tiver token → redireciona para Login (/)
 *
 * Token: é como um "bilhete" que prova que o usuário fez login
 * localStorage: é um armazenamento local no navegador
 */
function PrivateRoute() {
  // Procura pela chave 'auth_token' no localStorage
  const token = localStorage.getItem("auth_token");

  // Se tiver token, renderiza as rotas filhas (Outlet)
  // Se não tiver, redireciona para / (página de login)
  return token ? <Outlet /> : <Navigate to="/" replace />;
}

/**
 * Array de rotas
 *
 * Define a estrutura de navegação da aplicação
 * Cada objeto representa uma seção de rotas
 */
export const routes = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ROTAS PÚBLICAS (sem autenticação)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    // element: Layout que envolve estas rotas
    element: <PublicLayout />,

    // children: rotas filhas (páginas dentro deste layout)
    children: [
      {
        path: "/", // URL
        element: <Login />, // Componente que renderiza
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ROTAS PROTEGIDAS (precisa de token/autenticação)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    // element: PrivateRoute verifica se tem token
    element: <PrivateRoute />,

    // children: rotas filhas (protegidas)
    children: [
      {
        // element: AdminLayout envolve todas estas páginas
        // Fornece: sidebar (Aside), header (Topbar), etc
        element: <AdminLayout />,

        // children: todas as páginas do admin
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/usuarios",
            element: <Usuarios />,
          },
          {
            path: "/cadastrar",
            element: <Cadastrar />,
          },
          {
            path: "/caronas",
            element: <Caronas />,
          },
          {
            path: "/sugestoes",
            element: <Sugestoes />,
          },
          {
            path: "/relatorios",
            element: <Relatorios />,
          },
          {
            path: "/contratos",
            element: <Contratos />,
          },
          {
            path: "/notificacoes",
            element: <Notificacoes />,
          },
          {
            path: "/auditoria",
            element: <Auditoria />,
          },
        ],
      },
    ],
  },
];
