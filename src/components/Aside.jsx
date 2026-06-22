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
// Dados consumidos: user (via useAuth, vindo de GET /me)
// Estilo: Aside.module.css
// ============================================================

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

// Importando ícones individuais da biblioteca lucide-react.
// Cada nome é um ícone diferente — ex: Home = ícone de casa,
// Car = ícone de carro, LogOut = ícone de seta saindo.
import {
  IconHome,
  IconChartBar,
  IconSearch,
  IconPlus,
  IconCar,
  IconFileText,
  IconMessage,
  IconBell,
  IconShield,
  IconLifebuoy,
  IconLogout,
  IconX,
} from "@tabler/icons-react";

import { useAuth } from "../context/AuthContext";
import styles from "./Aside.module.css";

// getInitials: pega as 2 primeiras letras maiúsculas do nome
// para mostrar como avatar (ex: "Admin Sistema" → "AS").
// Fallback "?" quando o nome ainda não foi carregado.
function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function Aside({ isOpen, onClose }) {
  // useAuth: estado global de autenticação.
  //   user   → objeto com os dados do usuário logado (vindo de /me)
  //   isDev  → true se per_tipo === 2 (Desenvolvedor — vê tudo)
  //   logout → encerra a sessão (limpa tokens + invalida no backend)
  const { user, isDev, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // handleLogout: encerra a sessão e navega para o login.
  // Async porque logout() faz uma chamada à API para invalidar
  // o refresh token no servidor (best-effort, não bloqueia).
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // allMenuSections: array com TODOS os itens de menu possíveis,
  // organizados em seções/grupos.
  //
  // Cada item tem:
  //   icon         → componente de ícone da lucide-react
  //   label        → texto exibido no menu
  //   path         → rota para onde o link leva
  //   developerOnly → se true, só aparece para perfil Desenvolvedor.
  //                   A flag espelha a guarda DevRoute em routes.jsx:
  //                   itens com developerOnly=true correspondem a
  //                   rotas que o DevRoute bloqueia para Admins.
  //
  // Spec atual:
  //   Admin (per_tipo=1) vê: Painel, Usuários, Caronas,
  //                          Sugestões, Relatórios, Contratos
  //   Dev (per_tipo=2)   vê: tudo (acrescenta Cadastrar,
  //                          Emitir Notificação e Auditoria)
  const allMenuSections = [
    {
      title: "VISÃO GERAL",
      items: [
        {
          icon: IconHome,
          label: "Painel",
          path: "/painel",
          developerOnly: false,
        },
        {
          icon: IconChartBar,
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
          icon: IconSearch,
          label: "Procurar Usuário",
          path: "/usuarios",
          developerOnly: false,
        },
        {
          icon: IconPlus,
          label: "Instituições",
          path: "/cadastrar",
          developerOnly: true,
        },
      ],
    },
    {
      title: "OPERAÇÕES",
      items: [
        {
          icon: IconCar,
          label: "Registros de Carona",
          path: "/caronas",
          developerOnly: false,
        },
        {
          icon: IconFileText,
          label: "Contratos",
          path: "/contratos",
          developerOnly: false,
        },
        {
          icon: IconMessage,
          // Admin só vê Denúncias; Dev vê Sugestões + Denúncias
          label: isAdmin ? "Denúncias" : "Sugestões/Denúncias",
          path: "/sugestoes",
          developerOnly: false,
        },
        // {
        //   icon: IconBell,
        //   label: "Emitir Notificação",
        //   path: "/notificacoes",
        //   developerOnly: true,
        // },
        {
          icon: IconShield,
          label: "Auditoria",
          path: "/auditoria",
          developerOnly: true,
        },
        {
          icon: IconLifebuoy,
          label: "Suporte",
          path: "/suporte",
          developerOnly: true,
        },
      ],
    },
  ];

  // menuSections: versão filtrada de allMenuSections.
  // Usa .map() para percorrer cada seção e filtrar seus itens:
  //   - Se isDev → mostra todos os itens
  //   - Se não é Dev → mostra apenas itens com developerOnly: false
  // Depois, .filter() remove seções que ficaram sem itens.
  const menuSections = allMenuSections
    .map((section) => ({
      ...section, // copia todos os campos da seção (título, etc.)
      items: section.items.filter((item) => isDev || !item.developerOnly),
    }))
    .filter((section) => section.items.length > 0);

  // Dados visuais do usuário logado, derivados do AuthContext.
  // Defaults defensivos cobrem o intervalo curto entre a montagem
  // do Aside e a chegada do /me na primeira renderização.
  const userName = user?.usu_nome || "Usuário";
  const userRoleLabel = isDev ? "Desenvolvedor" : "Administrador";
  const userEmail = user?.usu_email || "";
  const [cardExpanded, setCardExpanded] = useState(false);

  return (
    <aside className={`${styles.aside} ${isOpen ? styles.asideOpen : ''}`}>
      {/* Cabeçalho com a logo do sistema */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <img
            src="/logo-texto.png"
            alt="CaronaCity"
            className={styles.logoImg}
          />
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
            <IconX size={20} />
          </button>
        )}
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
                        `${styles.link} ${isActive ? styles.active : ""}`
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

      {/* Rodapé: card do usuário (expansível) + botão de logout */}
      <div className={styles.footer}>
        <div className={styles.footerMain}>
          <button
            className={styles.userCardBtn}
            onClick={() => setCardExpanded(!cardExpanded)}
            aria-label="Informações do usuário"
          >
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>{getInitials(userName)}</div>
              <span className={styles.onlineDot} />
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{userName}</p>
              {userEmail && (
                <p className={styles.userEmailInline}>{userEmail}</p>
              )}
              <div className={styles.badgeWrapper}>
                <span className={styles.badge}>{userRoleLabel}</span>
                <div className={styles.tooltip}>
                  {isDev
                    ? "Acesso total ao sistema"
                    : "Gerenciar usuários e caronas"}
                </div>
              </div>
            </div>
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <IconLogout size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
