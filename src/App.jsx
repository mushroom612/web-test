
import './global.css';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { routes } from './router/routes';

function App() {
  const element = useRoutes(routes);
  return element;
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
