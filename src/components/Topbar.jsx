// ============================================================
// components/Topbar.jsx — Barra superior do painel
//
// Aparece no topo de TODAS as páginas internas (dentro do
// AdminLayout). Exibe o nome da página atual, notificações,
// o usuário logado e botões de ação.
//
// Bibliotecas usadas:
//   - react-router-dom:
//       useLocation → hook que retorna a URL atual
//                     (ex: { pathname: '/dashboard' })
//       useNavigate  → hook que retorna uma função para
//                     navegar entre páginas via código
//   - lucide-react → ícones SVG (Bell, Settings, LogOut)
//
// Dados consumidos: adminUser, notificationData (mockData.js)
// Estilo: Topbar.module.css
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut } from 'lucide-react';
import { adminUser, notificationData } from '../data/mockData';
import styles from './Topbar.module.css';

// pageNames: dicionário que mapeia cada rota para o nome
// "amigável" que aparece como título na barra superior.
// Ex: a URL '/caronas' vira "Registros de Carona" na tela.
// É um objeto JavaScript simples onde a chave é a URL
// e o valor é o nome a exibir.
const pageNames = {
  '/dashboard': 'Dashboard',
  '/usuarios': 'Usuários',
  '/cadastrar': 'Cadastrar Usuário',
  '/caronas': 'Registros de Carona',
  '/sugestoes': 'Sugestões e Denúncias',
  '/relatorios': 'Relatórios',
  '/contratos': 'Contratos',
  '/notificacoes': 'Emitir Notificação',
  '/auditoria': 'Auditoria',
  '/penalidades': 'Penalidades'
};

export function Topbar() {
  // useLocation: retorna um objeto com informações da URL atual.
  // location.pathname → string com o caminho, ex: '/dashboard'
  const location = useLocation();

  // useNavigate: retorna a função navigate() usada para
  // mudar de rota programaticamente (via código, não clique em link).
  const navigate = useNavigate();

  // Busca no dicionário pageNames o título da rota atual.
  // Se a rota não estiver mapeada, usa 'Dashboard' como padrão.
  const currentPageName = pageNames[location.pathname] || 'Dashboard';

  // handleLogout: ao clicar em "sair", navega para a raiz "/",
  // que é a tela de Login (conforme definido em routes.jsx).
  const handleLogout = () => {
    navigate('/');
  };

  return (
    // <header> → elemento HTML semântico para cabeçalhos de seção
    <header className={styles.topbar}>

      {/* Lado esquerdo: título da página atual */}
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{currentPageName}</h1>
      </div>

      {/* Lado direito: notificações, usuário e ações */}
      <div className={styles.right}>

        {/* Sino de notificações com badge de contagem.
            notificationData.count → número de notificações não lidas
            O badge só aparece se count > 0 (renderização condicional) */}
        <div className={styles.notificationBell}>
          <button className={styles.bellBtn}>
            <Bell size={20} />
            {notificationData.count > 0 && (
              <span className={styles.badge}>{notificationData.count}</span>
            )}
          </button>
        </div>

        {/* Seção do usuário logado: avatar + nome */}
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            {/* avatar → emoji do usuário, ex: 👨‍💼 */}
            <span className={styles.userAvatar}>{adminUser.avatar}</span>
            <span className={styles.userName}>{adminUser.name}</span>
          </div>
        </div>

        {/* Botão de configurações (sem ação implementada ainda) */}
        <button className={styles.iconBtn}>
          <Settings size={20} />
        </button>

        {/* Botão de logout — chama handleLogout ao ser clicado */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
