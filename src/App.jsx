import "./global.css";
import {BrowserRouter as Router, useRoutes} from "react-router-dom";
import {AuthProvider} from "./context/AuthContext";
import {routes} from "./router/routes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWrapper />
      </Router>
    </AuthProvider>
  );
}

function AppWrapper() {
  const element = useRoutes(routes);
  return element;
}

export default App;
