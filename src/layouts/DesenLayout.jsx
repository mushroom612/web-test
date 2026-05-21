// ============================================================
// layouts/DesenLayout.jsx — Layout exclusivo para desenvolvedores
//
// Estrutura idêntica ao AdminLayout: barra lateral (Aside),
// barra superior (Topbar) e área de conteúdo principal (Outlet).
// A diferença está no menu do Aside, que filtra itens por role:
//   - AdminLayout → exibido para admins (role 1)
//   - DesenLayout → exibido para desenvolvedores (role 2)
//
// O Aside interno lê o papel do usuário logado e exibe apenas
// os itens de menu autorizados para aquele perfil.
//
// Estrutura visual:
//   ┌──────────┬────────────────────────────────┐
//   │          │         [Topbar]               │
//   │  [Aside] ├────────────────────────────────┤
//   │  (menu)  │   <Outlet /> (página atual)    │
//   └──────────┴────────────────────────────────┘
//
// Como funciona o Outlet:
//   O componente <Outlet /> é do React Router DOM.
//   Ele funciona como um "buraco" onde a página filha é renderizada.
//   Exemplo: se a rota for /auditoria, o Outlet renderiza <Auditoria />.
//   O DesenLayout é o "moldura" e a página específica é o "conteúdo".
//
// Interligação:
//   - Definido em router/routes.jsx como layout das rotas de desenvolvedor
//   - Importa: Aside.jsx (menu lateral), Topbar.jsx (barra superior)
//   - react-router-dom → Outlet
//
// Estilo: DesenLayout.module.css
//   Classes CSS utilizadas:
//     .container → div raiz que organiza Aside + área principal lado a lado
//                  (tipicamente display: flex; height: 100vh)
//     .mainArea  → coluna direita que contém Topbar + conteúdo
//                  (flex: 1 para ocupar o espaço restante)
//     .content   → área de scroll abaixo do Topbar onde as páginas aparecem
//                  (overflow-y: auto; padding para respirar)
// ============================================================

import { Outlet } from 'react-router-dom';
import { Aside } from '../components/Aside';
import { Topbar } from '../components/Topbar';
import styles from './DesenLayout.module.css';

export function DesenLayout() {
  return (
    // styles.container → div raiz com display flex, alinhando Aside e mainArea lado a lado
    <div className={styles.container}>
      {/* Aside: barra lateral com os itens de menu.
          Para desenvolvedores, exibe itens extras como Auditoria. */}
      <Aside />

      {/* styles.mainArea → ocupa o restante da largura (flex: 1) */}
      <div className={styles.mainArea}>
        {/* Topbar: barra superior com título da página atual e botão de logout */}
        <Topbar />

        {/* styles.content → área rolável onde cada página é renderizada.
            <Outlet /> é preenchido pelo React Router com a página correspondente
            à URL atual (ex: /auditoria → <Auditoria />) */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
