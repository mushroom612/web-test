// ============================================================
// components/Aside.jsx — Menu lateral de navegação (sidebar)
//
// Este componente é a barra lateral fixa que aparece em todas
// as páginas internas da aplicação.
//
// Responsabilidades:
//   1. Exibir a logo do sistema
//   2. Renderizar os links de navegação agrupados por seção
//   3. Filtrar itens de menu conforme o perfil do usuário
//      (alguns itens são exclusivos para Desenvolvedores)
//   4. Mostrar o card do usuário logado no rodapé
//   5. Botão de logout
//
// Bibliotecas usadas:
//   - react-router-dom → NavLink: link de navegação que detecta
//     automaticamente se a rota está ativa (para destacar
//     visualmente o item selecionado no menu)
//   - lucide-react → ícones SVG prontos para usar como componentes
//     React. Cada ícone é um componente (ex: <Home size={20} />).
//
// Dados consumidos: adminUser (de mockData.js)
// Estilo: Aside.module.css
// ============================================================

import { NavLink } from 'react-router-dom';

// Importando ícones individuais da biblioteca lucide-react.
// Cada nome é um ícone diferente — ex: Home = ícone de casa,
// Car = ícone de carro, LogOut = ícone de seta saindo.
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

// adminUser: objeto com os dados do usuário logado atualmente.
// Importado de mockData.js (dados fictícios para desenvolvimento).
// Em produção, viria da API após o login.
import { adminUser } from '../data/mockData';
import styles from './Aside.module.css';

export function Aside() {
  // handleLogout: função chamada ao clicar no botão de sair.
  // Redireciona para a raiz "/" (página de Login).
  // window.location.href força uma recarga completa da página,
  // diferente do navigate() do React Router que troca apenas o componente.
  const handleLogout = () => {
    window.location.href = '/';
  };

  // Verifica se o usuário logado tem perfil de "Desenvolvedor".
  // Isso controla quais itens de menu aparecem para ele.
  const isDeveloper = adminUser.role === 'Desenvolvedor';

  // allMenuSections: array com TODOS os itens de menu possíveis,
  // organizados em seções/grupos.
  //
  // Cada item tem:
  //   icon         → componente de ícone da lucide-react
  //   label        → texto exibido no menu
  //   path         → rota para onde o link leva
  //   developerOnly → se true, só aparece para perfil Desenvolvedor
  const allMenuSections = [
    {
      title: 'VISÃO GERAL',
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard', developerOnly: false },
        { icon: BarChart3, label: 'Relatórios', path: '/relatorios', developerOnly: false }
      ]
    },
    {
      title: 'USUÁRIOS',
      items: [
        { icon: Search, label: 'Procurar Usuário', path: '/usuarios', developerOnly: true },
        { icon: Plus, label: 'Cadastrar', path: '/cadastrar', developerOnly: true }
      ]
    },
    {
      title: 'OPERAÇÕES',
      items: [
        { icon: Car, label: 'Registros de Carona', path: '/caronas', developerOnly: false },
        { icon: FileText, label: 'Contratos', path: '/contratos', developerOnly: true },
        { icon: MessageSquare, label: 'Sugestões/Denúncias', path: '/sugestoes', developerOnly: false },
        { icon: Bell, label: 'Emitir Notificação', path: '/notificacoes', developerOnly: true },
        { icon: Shield, label: 'Auditoria', path: '/auditoria', developerOnly: false }
      ]
    }
  ];

  // menuSections: versão filtrada de allMenuSections.
  // Usa .map() para percorrer cada seção e filtrar seus itens:
  //   - Se isDeveloper → mostra todos os itens
  //   - Se não é dev   → mostra apenas itens com developerOnly: false
  // Depois, .filter() remove seções que ficaram sem itens.
  const menuSections = allMenuSections
    .map(section => ({
      ...section,  // copia todos os campos da seção (título, etc.)
      items: section.items.filter(item => isDeveloper || !item.developerOnly)
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside className={styles.aside}>

      {/* Cabeçalho com a logo do sistema */}
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

      {/* Navegação principal — percorre as seções filtradas */}
      <nav className={styles.nav}>
        {menuSections.map((section) => (
          // key={section.title}: o React precisa de uma "chave" única
          // em listas para rastrear cada elemento corretamente.
          <div key={section.title} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.list}>
              {section.items.map((item) => {
                // O ícone é armazenado como referência ao componente.
                // Para usar, atribuímos a uma variável com inicial maiúscula
                // (convenção do React para componentes).
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    {/* NavLink: igual ao <a> do HTML, mas integrado ao
                        React Router. Detecta se a rota está ativa e
                        permite aplicar estilo diferente ao link atual.

                        className recebe uma função que retorna a string
                        de classes CSS. Se isActive for true, adiciona
                        a classe styles.active ao link selecionado. */}
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `${styles.link} ${isActive ? styles.active : ''}`
                      }
                    >
                      {/* Renderiza o ícone com tamanho 20px */}
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

      {/* Rodapé do menu: card do usuário logado + botão de logout */}
      <div className={styles.footer}>
        <div className={styles.userCard}>
          {/* avatar: emoji que representa o usuário (ex: 👨‍💼) */}
          <div className={styles.avatar}>{adminUser.avatar}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{adminUser.name}</p>
            {/* badge: exibe o papel do usuário (ex: "Desenvolvedor") */}
            <span className={styles.badge}>{adminUser.role}</span>
          </div>
        </div>
        {/* Botão de logout — chama handleLogout ao ser clicado */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
