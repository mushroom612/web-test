import { NavLink } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Search,
  Plus,
  Car,
  FileText,
  MessageSquare,
  Bell,
  Shield,
  LogOut
} from 'lucide-react';
import { adminUser } from '../data/mockData';
import styles from './Aside.module.css';

export function Aside() {
  const handleLogout = () => {
    window.location.href = '/';
  };

  const menuSections = [
    {
      title: 'VISÃO GERAL',
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: BarChart3, label: 'Relatórios', path: '/relatorios' }
      ]
    },
    {
      title: 'USUÁRIOS',
      items: [
        { icon: Search, label: 'Procurar Usuário', path: '/usuarios' },
        { icon: Plus, label: 'Cadastrar', path: '/cadastrar' }
      ]
    },
    {
      title: 'OPERAÇÕES',
      items: [
        { icon: Car, label: 'Registros de Carona', path: '/caronas' },
        { icon: FileText, label: 'Contratos', path: '/contratos' },
        { icon: MessageSquare, label: 'Sugestões/Denúncias', path: '/sugestoes' },
        { icon: Bell, label: 'Emitir Notificação', path: '/notificacoes' },
        { icon: Shield, label: 'Auditoria', path: '/auditoria' }
      ]
    }
  ];

  return (
    <aside className={styles.aside}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {/* OPÇÃO 1: Apenas com ícone + texto (padrão) */}
          {/* <Car size={24} />
          <span>CaronaCity</span> */}

          {/* OPÇÃO 2: Apenas com logo (descomente abaixo e comente a opção 1) */}
           <img src="/logo-texto.png" alt="CaronaCity" className={styles.logoImg} />

          {/* OPÇÃO 3: Logo + texto (descomente abaixo comete a opção 1) */}
          {/* 
          <img src="/logo-texto.png" alt="CaronaCity" className={styles.logoImg} />
          <span>CaronaCity</span>
          */}
        </div>
      </div>

      <nav className={styles.nav}>
        {menuSections.map((section) => (
          <div key={section.title} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.list}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `${styles.link} ${isActive ? styles.active : ''}`
                      }
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{adminUser.avatar}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{adminUser.name}</p>
            <span className={styles.badge}>{adminUser.role}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
