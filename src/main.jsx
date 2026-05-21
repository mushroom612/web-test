// ============================================================
// main.jsx — Ponto de entrada da aplicação React
//
// Este é o PRIMEIRO arquivo executado quando o projeto abre
// no navegador. Ele "injeta" todo o React dentro do HTML.
//
// Biblioteca usada: react-dom/client (faz parte do React)
// ============================================================

// StrictMode: modo especial do React que ajuda a encontrar
// erros comuns durante o desenvolvimento. Em produção ele
// não muda o comportamento visual, só ajuda no debug.
import { StrictMode } from 'react'

// createRoot: função que conecta o React ao HTML da página.
// Ela recebe um elemento do HTML e diz "a partir daqui, o
// React controla tudo".
import { createRoot } from 'react-dom/client'

// App: componente principal que contém toda a aplicação.
// Definido em ./App.jsx — tudo começa a partir dele.
import App from './App.jsx'

// document.getElementById('root') → busca a <div id="root">
// que fica no arquivo index.html. É ali que o React "aparece".
//
// .render(...) → manda o React desenhar o componente <App />
// dentro daquela div. O <StrictMode> envolve o App para
// ativar as verificações extras de desenvolvimento.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
