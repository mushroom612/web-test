/**
 * ============================================================================
 * ARQUIVO: src/main.jsx
 * DESCRIÇÃO: Ponto de entrada da aplicação React
 *
 * Este arquivo:
 * 1. Importa bibliotecas necessárias (React, ReactDOM)
 * 2. Procura o container "root" no HTML
 * 3. Renderiza o componente App dentro desse container
 * 4. Usa StrictMode para detectar problemas em desenvolvimento
 *
 * Fluxo:
 * 1. Navegador carrega index.html
 * 2. index.html importa este arquivo (main.jsx)
 * 3. Este arquivo renderiza o componente App (veja App.jsx)
 * 4. Todo o resto da aplicação é carregado a partir de App.jsx
 *
 * StrictMode:
 * - Ativa verificações extras em desenvolvimento
 * - Ajuda a encontrar bugs potenciais
 * - Não afeta a versão de produção
 * ============================================================================
 */

// Importa a função StrictMode do React
// StrictMode é um "verificador" que avisa sobre problemas em desenvolvimento
import { StrictMode } from "react";

// Importa a função createRoot do ReactDOM
// createRoot cria a raiz da aplicação React em um elemento HTML
import { createRoot } from "react-dom/client";

// Importa o componente principal App (veja App.jsx)
import App from "./App.jsx";

// Procura o elemento HTML com id="root" (definido em index.html)
// e cria o "root" da aplicação React nele
createRoot(document.getElementById("root")).render(
  // StrictMode envolve a app para ativar verificações extras de desenvolvimento
  <StrictMode>
    <App />
  </StrictMode>,
);
