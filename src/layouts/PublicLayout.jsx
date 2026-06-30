// ============================================================
// layouts/PublicLayout.jsx — Layout para páginas públicas
//
// Um "layout" é uma moldura visual reutilizável.
// O PublicLayout é a moldura mais simples do projeto:
// ele só centraliza o conteúdo na tela (via CSS) e renderiza
// a página filha no lugar do <Outlet />.
//
// Página que usa este layout: Login (rota "/")
//
// Biblioteca usada: react-router-dom
//   - Outlet → espaço reservado onde a página filha aparece.
//     Quando o usuário acessa "/", o roteador coloca <Login />
//     no lugar do <Outlet />.
//
// Estilo: PublicLayout.module.css
//   CSS Modules → arquivo de CSS exclusivo deste componente.
//   Os nomes de classe ficam isolados (não vazam para outros
//   componentes), evitando conflitos de estilo.
// ============================================================

import { Outlet } from "react-router-dom";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
  return (
    // styles.container → classe CSS definida em PublicLayout.module.css
    // Normalmente aplica: display flex, align/justify center,
    // min-height 100vh para cobrir a tela toda.
    <div className={styles.container}>
      {/* Outlet: aqui dentro aparece a página filha.
          No caso deste layout, sempre será o <Login />. */}
      <Outlet />
    </div>
  );
}
