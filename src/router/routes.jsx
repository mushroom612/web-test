<<<<<<< Updated upstream
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
=======
import {AdminLayout} from "../layouts/AdminLayout";
import {DesenLayout} from "../layouts/DesenLayout";
import {PublicLayout} from "../layouts/PublicLayout";
import {Login} from "../pages/Login";
import {Dashboard} from "../pages/Dashboard";
import {Usuarios} from "../pages/Usuarios";
import {Caronas} from "../pages/Caronas";
import {Sugestoes} from "../pages/Sugestoes";
import {Relatorios} from "../pages/Relatorios";
import {Cadastrar} from "../pages/Cadastrar";
import {Contratos} from "../pages/Contratos";
import {Notificacoes} from "../pages/Notificacoes";
import {Auditoria} from "../pages/Auditoria";
import {ProtectedRoute} from "./ProtectedRoute";
>>>>>>> Stashed changes

export const routes = [
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute requiredRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
<<<<<<< Updated upstream
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
=======
      {path: "/dashboard", element: <Dashboard />},
      {path: "/usuarios", element: <Usuarios />},
      {path: "/caronas", element: <Caronas />},
      {path: "/sugestoes", element: <Sugestoes />},
      {path: "/relatorios", element: <Relatorios />},
      {path: "/notificacoes", element: <Notificacoes />},
      {path: "/auditoria", element: <Auditoria />},
    ],
  },
  {
    element: (
      <ProtectedRoute requiredRoles={["developer"]}>
        <DesenLayout />
      </ProtectedRoute>
    ),
    children: [
      {path: "/dashboard", element: <Dashboard />},
      {path: "/usuarios", element: <Usuarios />},
      {path: "/cadastrar", element: <Cadastrar />},
      {path: "/caronas", element: <Caronas />},
      {path: "/sugestoes", element: <Sugestoes />},
      {path: "/relatorios", element: <Relatorios />},
      {path: "/contratos", element: <Contratos />},
      {path: "/notificacoes", element: <Notificacoes />},
      {path: "/auditoria", element: <Auditoria />},
    ],
>>>>>>> Stashed changes
  },
];
