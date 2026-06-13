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
import { useAuth } from '../context/AuthContext';

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
// import { Notificacoes } from '../pages/Notificacoes';
import { Auditoria } from '../pages/Auditoria';
import { Suporte } from '../pages/Suporte';

// ── Guardas de rota ──────────────────────────────────────────
// O sistema tem dois níveis de proteção:
//   1. PrivateRoute  → exige autenticação + papel >= 1 (Admin ou Dev)
//   2. DevRoute      → exige papel === 2 (apenas Desenvolvedor)
//
// Páginas Admin+Dev:  /dashboard, /usuarios, /caronas,
//                     /sugestoes, /relatorios, /contratos
// Páginas só Dev:     /cadastrar, /notificacoes, /auditoria
//
// O backend já restringe Admin (per_tipo=1) aos dados da própria
// escola via JWT; aqui só controlamos o acesso à navegação.

// PrivateRoute: "porteiro" das páginas internas. Consulta o
// AuthContext em vez de ler o localStorage diretamente — isso
// garante que o estado da UI (Aside, Topbar, etc.) fique sempre
// em sincronia com a decisão de redirecionamento.
//
// Estados possíveis:
//   loading=true     → ainda hidratando o token salvo; mostra
//                      placeholder neutro para não piscar o login
//   isAuthenticated=false → redireciona para "/" (Login)
//   role < 1         → usuário comum bloqueado; redireciona
//   role >= 1        → libera (<Outlet />)
function PrivateRoute() {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    // Placeholder simples: o boot é rápido (apenas uma chamada /me).
    // Mantemos sem framework de loading porque é uma transição curta.
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated || role < 1) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// DevRoute: guarda secundária que protege páginas exclusivas
// do Desenvolvedor. Já está aninhada dentro do PrivateRoute,
// então pode assumir que o usuário está autenticado — só
// precisa checar se o papel é Dev (2). Se não for, devolve
// para /dashboard (onde o Admin pode estar).
//
// Importante: também protege contra acesso direto via URL.
// Mesmo que o item do menu fique oculto para o Admin, digitar
// /auditoria na barra cai aqui e é redirecionado.
function DevRoute() {
  const { isDev } = useAuth();
  if (!isDev) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
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
          // ─── Páginas para Admin + Dev ───────────────────────
          // Acesso liberado para qualquer usuário com papel >= 1.
          // Para Admin (per_tipo=1) o backend filtra os dados por
          // escola; para Dev (per_tipo=2) retorna todos.
          {
            path: '/dashboard',
            element: <Dashboard />
          },
          {
            path: '/usuarios',
            element: <Usuarios />
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

          // ─── Suporte: acessível por Admin + Dev  [v30] ──────
          {
            path: '/suporte',
            element: <Suporte />
          },

          // ─── Páginas exclusivas do Desenvolvedor ────────────
          // Cadastrar (novas escolas/admins), Notificações em
          // massa e Auditoria envolvem operações globais que
          // ultrapassam o escopo de uma única instituição.
          {
            element: <DevRoute />,
            children: [
              {
                path: '/cadastrar',
                element: <Cadastrar />
              },
              // {
              //   path: '/notificacoes',
              //   element: <Notificacoes />
              // },
              {
                path: '/auditoria',
                element: <Auditoria />
              }
            ]
          }
        ]
      }
    ]
  }
];
