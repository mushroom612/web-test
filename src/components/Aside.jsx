/**
 * ============================================================================
 * ARQUIVO: src/components/Aside.jsx
 * DESCRIÇÃO: Componente da barra lateral (sidebar) com menu de navegação
 *
 * O Aside (sidebar esquerda) mostra:
 * - Logo da aplicação
 * - Menu de navegação com seções organizadas
 * - Diferentes itens conforme o papel do usuário (admin vs desenvolvedor)
 * - Card com informações do usuário logado
 * - Botão de logout
 *
 * Como funciona:
 * 1. Identifica se o usuário é "Desenvolvedor" ou outro papel
 * 2. Filtra o menu para mostrar apenas itens relevantes
 * 3. Renderiza seções com links de navegação
 * 4. Cada link usa NavLink do React Router (ativa automatically quando ativo)
 *
 * Interligação:
 * - Usado em: AdminLayout.jsx e DesenLayout.jsx
 * - Dados de: mockData.js (adminUser)
 * - CSS: Aside.module.css
 * ============================================================================
 */

// Importa NavLink do React Router
// NavLink é como um <a> mas para navegação SPA (sem recarregar página)
import { NavLink } from "react-router-dom";

// Importa ícones do Lucide React
import {
  Home, // Dashboard
  BarChart3, // Relatórios
  Search, // Procurar Usuário
  Plus, // Cadastrar
  Car, // Caronas
  FileText, // Contratos
  MessageSquare, // Sugestões
  Bell, // Notificações
  Shield, // Auditoria
  LogOut, // Logout
} from "lucide-react";

// Importa dados mock (informações do usuário admin)
import { adminUser } from "../data/mockData";

// Importa estilos CSS
import styles from "./Aside.module.css";

/**
 * Componente Aside
 *
 * Renderiza a barra lateral (sidebar) com menu de navegação
 * @returns {JSX} - Sidebar com menu e footer
 */
export function Aside() {
  /**
   * Função handleLogout
   *
   * Remove dados de autenticação e redireciona para login
   * window.location.href força recarregamento de página (logout completo)
   */
  const handleLogout = () => {
    window.location.href = "/"; // Redireciona para página de login
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTRAGEM DE MENU POR PAPEL DO USUÁRIO
  // ─────────────────────────────────────────────────────────────────────────

  // Verifica se o usuário é Desenvolvedor (tem acesso a mais opções)
  const isDeveloper = adminUser.role === "Desenvolvedor";

  /**
   * Definição de TODAS as seções do menu
   *
   * Cada seção tem:
   * - title: nome da seção (VISÃO GERAL, USUÁRIOS, etc)
   * - items: array de itens do menu
   *   - icon: ícone a mostrar
   *   - label: texto do link
   *   - path: URL/rota
   *   - developerOnly: true = só desenvolvedores veem
   */
  const allMenuSections = [
    {
      title: "VISÃO GERAL",
      items: [
        {
          icon: Home,
          label: "Dashboard",
          path: "/dashboard",
          developerOnly: false,
        },
        {
          icon: BarChart3,
          label: "Relatórios",
          path: "/relatorios",
          developerOnly: false,
        },
      ],
    },
    {
      title: "USUÁRIOS",
      items: [
        {
          icon: Search,
          label: "Procurar Usuário",
          path: "/usuarios",
          developerOnly: true,
        },
        {
          icon: Plus,
          label: "Cadastrar",
          path: "/cadastrar",
          developerOnly: true,
        },
      ],
    },
    {
      title: "OPERAÇÕES",
      items: [
        {
          icon: Car,
          label: "Registros de Carona",
          path: "/caronas",
          developerOnly: false,
        },
        {
          icon: FileText,
          label: "Contratos",
          path: "/contratos",
          developerOnly: true,
        },
        {
          icon: MessageSquare,
          label: "Sugestões/Denúncias",
          path: "/sugestoes",
          developerOnly: false,
        },
        {
          icon: Bell,
          label: "Emitir Notificação",
          path: "/notificacoes",
          developerOnly: true,
        },
        {
          icon: Shield,
          label: "Auditoria",
          path: "/auditoria",
          developerOnly: false,
        },
      ],
    },
  ];

  /**
   * FILTRA o menu baseado no papel do usuário
   *
   * Processo:
   * 1. Para cada seção: filtra items (remove se developerOnly e não é dev)
   * 2. Remove seções vazias (que ficaram sem itens)
   *
   * Resultado: menuSections contém apenas itens que o usuário pode ver
   */
  const menuSections = allMenuSections
    .map((section) => ({
      ...section,
      // Filtra items: mantém se for dev OU se não for developerOnly
      items: section.items.filter((item) => isDeveloper || !item.developerOnly),
    }))
    // Remove seções que ficaram sem itens
    .filter((section) => section.items.length > 0);

  return (
    // Container principal da sidebar
    <aside className={styles.aside}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER COM LOGO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.logo}>
          {/* Opções de logo (descomente a que preferir): */}

          {/* OPÇÃO 1: Apenas com ícone + texto (padrão) */}
          {/* <Car size={24} /> */}
          {/* <span>CaronaCity</span> */}

          {/* OPÇÃO 2: Apenas com imagem de logo (ATIVA AGORA) */}
          <img
            src="/logo-texto.png"
            alt="CaronaCity"
            className={styles.logoImg}
          />

          {/* OPÇÃO 3: Logo + texto (para descomentar no futuro) */}
          {/* 
          <img src="/logo-texto.png" alt="CaronaCity" className={styles.logoImg} />
          <span>CaronaCity</span>
          */}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MENU DE NAVEGAÇÃO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        {/* Para cada seção do menu */}
        {menuSections.map((section) => (
          <div key={section.title} className={styles.section}>
            {/* Título da seção (ex: "VISÃO GERAL", "USUÁRIOS") */}
            <h3 className={styles.sectionTitle}>{section.title}</h3>

            {/* Lista de items da seção */}
            <ul className={styles.list}>
              {section.items.map((item) => {
                // Extrai o ícone (é um componente React)
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    {/* 
                      NavLink: link de navegação do React Router
                      - to: para qual rota ir
                      - className: função que retorna classes (ativa quando está na rota atual)
                    */}
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        // Se é a rota ativa, adiciona classe 'active'
                        `${styles.link} ${isActive ? styles.active : ""}`
                      }
                    >
                      {/* Ícone do item */}
                      <Icon size={20} />
                      {/* Texto do item */}
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FOOTER COM USUÁRIO E LOGOUT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        {/* Card com informações do usuário logado */}
        <div className={styles.userCard}>
          {/* Avatar (emoji ou inicial) */}
          <div className={styles.avatar}>{adminUser.avatar}</div>

          {/* Informações: nome e papel */}
          <div className={styles.userInfo}>
            <p className={styles.userName}>{adminUser.name}</p>
            <span className={styles.badge}>{adminUser.role}</span>
          </div>
        </div>

        {/* Botão de logout */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
