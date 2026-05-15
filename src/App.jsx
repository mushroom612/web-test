/**
 * ============================================================================
 * ARQUIVO: src/App.jsx
 * DESCRIÇÃO: Componente raiz da aplicação - configura o sistema de roteamento
 *
 * Este arquivo:
 * 1. Importa o CSS global para toda a aplicação
 * 2. Importa o React Router para permitir navegação entre páginas
 * 3. Importa as rotas definidas em router/routes.jsx
 * 4. Configura o sistema de roteamento
 *
 * O que faz cada parte:
 * - './global.css': estilos CSS que se aplicam a todo o site
 * - BrowserRouter: componente que permite usar navegação no React
 * - useRoutes: hook que renderiza a rota correta baseado na URL atual
 * - AppWrapper: envolve tudo com o BrowserRouter necessário
 *
 * Fluxo:
 * 1. main.jsx renderiza App
 * 2. AppWrapper configura BrowserRouter
 * 3. App lê a URL atual e renderiza a página correta (usando routes)
 * 4. Cada página (Dashboard, Login, etc) é renderizada neste ponto
 *
 * Como funciona o roteamento:
 * - URL /              → Renderiza componente Login
 * - URL /dashboard     → Renderiza componente Dashboard
 * - URL /usuarios      → Renderiza componente Usuarios
 * - etc (veja router/routes.jsx para todas as rotas)
 * ============================================================================
 */

// Importa CSS global - estilos que se aplicam a todo o site
import "./global.css";

// Importa BrowserRouter do React Router
// BrowserRouter permite criar navegação sem recarregar a página
import { BrowserRouter as Router, useRoutes } from "react-router-dom";

// Importa as rotas configuradas (veja router/routes.jsx)
import { routes } from "./router/routes";

/**
 * Componente App
 *
 * Esta é a função que renderiza a rota correta baseado na URL
 * useRoutes(routes) lê a URL atual e renderiza o componente certo
 */
function App() {
  // useRoutes: pega a lista de rotas e a URL atual
  // returna o componente que deve ser renderizado
  const element = useRoutes(routes);
  return element;
}

/**
 * Componente AppWrapper
 *
 * Este componente envolve App com BrowserRouter
 * BrowserRouter é necessário para que useRoutes funcione
 *
 * É como se fosse um "wrap" que ativa o sistema de navegação
 */
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

// Exporta AppWrapper como componente padrão
// main.jsx importa e renderiza este componente
export default AppWrapper;
