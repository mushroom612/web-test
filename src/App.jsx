// ============================================================
// App.jsx — Componente raiz da aplicação
//
// Este arquivo é chamado pelo main.jsx e tem uma única
// responsabilidade: configurar o sistema de navegação (rotas).
//
// Bibliotecas usadas:
//   - react-router-dom → biblioteca de roteamento para React.
//     "Rota" significa: qual página mostrar dependendo da URL.
//     Ex: acessar "/painel"  → mostra o Painel
//         acessar "/"        → mostra o Login
// ============================================================

// global.css → arquivo de estilos CSS que se aplica a toda
// a aplicação (fontes, cores base, reset de margens, etc.)
import "./global.css";

// BrowserRouter (apelidado de "Router"): componente que
// ativa o sistema de rotas. Ele "escuta" a URL do navegador
// e decide qual página renderizar. Precisa envolver toda a app.
//
// useRoutes: hook (função especial do React) que transforma
// o array de rotas definido em routes.jsx em componentes reais.
import { BrowserRouter as Router, useRoutes } from "react-router-dom";

// routes: array com todas as rotas da aplicação.
// Definido em ./router/routes.jsx — lá estão os caminhos
// como "/dashboard", "/usuarios", etc.
import { routes } from "./router/routes";

// AuthProvider: fornece estado global de autenticação (usuário,
// papel, login/logout) para toda a árvore. Componentes acessam
// via o hook useAuth() exportado em ./context/AuthContext.jsx.
import { AuthProvider } from "./context/AuthContext";

// App: componente interno que usa o hook useRoutes para
// converter o array de rotas em um elemento JSX renderizável.
// Ele precisa estar DENTRO do <Router> para funcionar,
// por isso existe o AppWrapper abaixo.
function App() {
  // useRoutes recebe o array de rotas e devolve o elemento
  // correspondente à URL atual do navegador.
  const element = useRoutes(routes);
  return element;
}

// AppWrapper: componente que envolve o <App /> com o <Router>.
// Essa separação existe porque useRoutes só pode ser chamado
// dentro de um contexto de Router — então o Router fica aqui
// fora, e o App (que usa useRoutes) fica dentro.
//
// Este é o componente exportado e usado no main.jsx.
function AppWrapper() {
  return (
    <Router>
      {/* AuthProvider envolve as rotas para que PrivateRoute e Login
          possam ler/alterar o estado de autenticação via useAuth(). */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

// export default → torna AppWrapper disponível para outros
// arquivos importarem. O main.jsx importa este arquivo assim:
// import App from './App.jsx'  (o "App" do import é o AppWrapper)
export default AppWrapper;
