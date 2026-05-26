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
// Dados consumidos:
//   - useAuth() → usuário logado (nome, papel)
//   - notificationData (mockData.js) → ainda mockado; será migrado
//     junto com o endpoint de Notificações em rodada futura.
// Estilo: Topbar.module.css
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut } from 'lucide-react';
import { notificationData } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import styles from './Topbar.module.css';

// getInitials: igual ao do Aside — pega 2 letras maiúsculas
// do nome (ex: "Admin Sistema" → "AS") para usar como avatar
// até o backend expor uma URL de foto.
function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

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

  // useAuth: usuário real + logout. user pode ser null por instantes
  // (entre montagem e chegada do /me); defaults defensivos abaixo.
  const { user, isDev, logout } = useAuth();
  const userName = user?.usu_nome || 'Usuário';

  // Busca no dicionário pageNames o título da rota atual.
  // Se a rota não estiver mapeada, usa 'Dashboard' como padrão.
  const currentPageName = pageNames[location.pathname] || 'Dashboard';

  // handleLogout: encerra a sessão (limpa tokens + notifica backend)
  // e navega para o login. await garante que o estado já foi zerado
  // quando o redirecionamento acontece — evita "piscar" o painel.
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
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

        {/* Seção do usuário logado: avatar + nome (vindo do AuthContext) */}
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            {/* Avatar: iniciais do nome real (ex: "Admin Sistema" → "AS").
                title exibe o papel ao passar o mouse — útil para distinguir
                Admin Escola de Desenvolvedor sem ocupar espaço extra. */}
            <span className={styles.userAvatar} title={isDev ? 'Desenvolvedor' : 'Administrador'}>
              {getInitials(userName)}
            </span>
            <span className={styles.userName}>{userName}</span>
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
