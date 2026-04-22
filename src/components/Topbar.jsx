import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut } from 'lucide-react';
import { adminUser, notificationData } from '../data/mockData';
import styles from './Topbar.module.css';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/usuarios': 'Usuários',
  '/cadastrar': 'Cadastrar Usuário',
  '/caronas': 'Registros de Carona',
  '/sugestoes': 'Sugestões e Denúncias',
  '/relatorios': 'Relatórios',
  '/contratos': 'Contratos',
  '/notificacoes': 'Emitir Notificação',
  '/auditoria': 'Auditoria'
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPageName = pageNames[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{currentPageName}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.notificationBell}>
          <button className={styles.bellBtn}>
            <Bell size={20} />
            {notificationData.count > 0 && (
              <span className={styles.badge}>{notificationData.count}</span>
            )}
          </button>
        </div>

        <div className={styles.userSection}> 
          <div className={styles.userProfile}>
            <span className={styles.userAvatar}>{adminUser.avatar}</span>
            <span className={styles.userName}>{adminUser.name}</span>
          </div>
        </div>

        <button className={styles.iconBtn}>
          <Settings size={20} />
        </button>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
