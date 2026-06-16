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

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconLogout, IconChevronDown, IconLifebuoy, IconMenu2 } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { SupportChatPanel } from "./SupportChatPanel";
import styles from "./Topbar.module.css";

// getInitials: igual ao do Aside — pega 2 letras maiúsculas
// do nome (ex: "Admin Sistema" → "AS") para usar como avatar
// até o backend expor uma URL de foto.
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

const PAGE_INFO = {
  '/dashboard': { title: 'Painel',                subtitle: 'Visão geral da plataforma TucTuc' },
  '/usuarios':  { title: 'Usuários',              subtitle: 'Lista de usuários cadastrados' },
  '/auditoria': { title: 'Auditoria',             subtitle: 'Registro de ações realizadas por administradores' },
  '/caronas':   { title: 'Registros de Carona',   subtitle: 'Gerencie todas as caronas da plataforma' },
  '/relatorios':{ title: 'Relatórios',            subtitle: null },
  '/suporte':   { title: 'Suporte',               subtitle: 'Canal de comunicação entre administradores e desenvolvedores' },
  '/cadastrar': { title: 'Nova Instituição',       subtitle: 'Cadastre uma nova instituição parceira na plataforma' },
  '/instituicoes': { title: 'Instituições',        subtitle: 'Gerencie as instituições parceiras da plataforma TucTuc' },
};

export function Topbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { user, isDev, isAdmin, logout } = useAuth();
  const userName = user?.usu_nome || "Usuário";
  const userEmail = user?.usu_email || "";

  const [openMenu, setOpenMenu] = useState(null); // 'suporte' | 'user' | null

  // suporteNaoLidas: contador para o badge do botão de suporte.
  // Admin → respostas do Dev não lidas; Dev → mensagens de admins não lidas.
  // Polling leve a cada 15s (a camada de dados ainda é mockada).
  const [suporteNaoLidas, setSuporteNaoLidas] = useState(0);

  const rightRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rightRef.current && !rightRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca o contador de não lidas do suporte conforme o papel.
  useEffect(() => {
    if (!user?.usu_id) return;
    const role = isDev ? "dev" : "admin";
    let cancelled = false;
    const fetchNaoLidas = async () => {
      try {
        const data = await api.getNaoLidasSuporte({ role, usuId: user.usu_id });
        if (!cancelled) setSuporteNaoLidas(data?.nao_lidas || 0);
      } catch {
        // silencioso
      }
    };
    fetchNaoLidas();
    const id = setInterval(fetchNaoLidas, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.usu_id, isDev, openMenu]);

  const getPageInfo = () => {
    if (pathname === '/contratos') {
      return {
        title: 'Contratos Institucionais',
        subtitle: isAdmin
          ? 'Visualize o contrato da sua instituição com a plataforma TucTuc'
          : 'Contratos de todas as instituições parceiras da plataforma TucTuc',
      };
    }
    if (pathname === '/sugestoes') {
      return {
        title: isAdmin ? 'Denúncias' : 'Sugestões e Denúncias',
        subtitle: isAdmin
          ? 'Gerencie as denúncias enviadas pelos usuários da sua instituição'
          : 'Gerencie os feedbacks, dúvidas e denúncias enviados pelos usuários',
      };
    }
    return PAGE_INFO[pathname] || null;
  };

  const pageInfo = getPageInfo();

  const toggleMenu = (menu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // handleLogout: encerra a sessão (limpa tokens + notifica backend)
  // e navega para o login. await garante que o estado já foi zerado
  // quando o redirecionamento acontece — evita "piscar" o painel.
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // handleSupportClick: o suporte tem ergonomia diferente por papel.
  //   Admin → abre o painel flutuante de chat aqui mesmo na topbar.
  //   Dev   → vai para a página /suporte (caixa de entrada completa).
  const handleSupportClick = () => {
    if (isDev) {
      setOpenMenu(null);
      navigate("/suporte");
    } else {
      toggleMenu("suporte");
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {onMenuToggle && (
          <button
            className={styles.hamburger}
            onClick={onMenuToggle}
            aria-label="Abrir menu"
          >
            <IconMenu2 size={22} />
          </button>
        )}
        {pageInfo && (
          <div className={styles.pageInfo}>
            <h1 className={styles.pageTitle}>{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className={styles.pageSubtitle}>{pageInfo.subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Lado direito: usuário e ações */}
      <div className={styles.right} ref={rightRef}>
        {/* Seção do usuário logado com mini-menu ao clicar */}
        <div className={styles.userSection}>
          <button
            className={styles.userProfileBtn}
            onClick={() => toggleMenu("user")}
            aria-label="Menu do usuário"
          >
            <span
              className={styles.userAvatar}
              title={isDev ? "Desenvolvedor" : "Administrador"}
            >
              {getInitials(userName)}
            </span>
            <span className={styles.userName}>{userName}</span>
            <IconChevronDown
              size={14}
              className={
                openMenu === "user" ? styles.chevronUp : styles.chevronDown
              }
            />
          </button>

          {openMenu === "user" && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownProfile}>
                <span className={styles.dropdownProfileAvatar}>
                  {getInitials(userName)}
                </span>
                <div className={styles.dropdownProfileInfo}>
                  <p className={styles.dropdownProfileName}>{userName}</p>
                  {userEmail && (
                    <p className={styles.dropdownProfileEmail}>{userEmail}</p>
                  )}
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={handleLogout}
              >
                <IconLogout size={15} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão de suporte: Admin abre o chat aqui; Dev vai para /suporte.
            Substitui o antigo ícone de configurações. */}
        <div className={styles.supportWrapper}>
          <button
            className={styles.iconBtn}
            onClick={handleSupportClick}
            aria-label={isDev ? "Suporte" : "Falar com o desenvolvedor"}
            title={isDev ? "Suporte" : "Falar com o desenvolvedor"}
          >
            <IconLifebuoy size={20} />
            {suporteNaoLidas > 0 && (
              <span className={styles.badge}>{suporteNaoLidas}</span>
            )}
          </button>

          {/* Painel de chat só para Admin (Dev usa a página dedicada) */}
          {isAdmin && openMenu === "suporte" && (
            <SupportChatPanel onClose={() => setOpenMenu(null)} />
          )}
        </div>

        {/* Botão de logout — chama handleLogout ao ser clicado */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <IconLogout size={20} />
        </button>
      </div>
    </header>
  );
}
