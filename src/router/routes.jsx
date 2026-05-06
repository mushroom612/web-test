import { Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
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
import { Penalidades } from '../pages/Penalidades';

function PrivateRoute() {
  const token = localStorage.getItem('auth_token');
  return token ? <Outlet /> : <Navigate to="/" replace />;
}

export const routes = [
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <Login />
      }
    ]
  },
  {
    element: <PrivateRoute />,
    children: [
      {
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
          {
            path: '/penalidades',
            element: <Penalidades />
          }
        ]
      }
    ]
  }
];
