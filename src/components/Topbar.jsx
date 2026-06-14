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
import { useLocation, useNavigate } from "react-router-dom";
import { IconBell, IconLogout, IconChevronDown, IconLifebuoy, IconMenu2 } from "@tabler/icons-react";
import { notificationData } from "../data/mockData";
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

// pageNames: dicionário que mapeia cada rota para o nome
// "amigável" que aparece como título na barra superior.
// Ex: a URL '/caronas' vira "Registros de Carona" na tela.
// É um objeto JavaScript simples onde a chave é a URL
// e o valor é o nome a exibir.
const pageNames = {
  "/dashboard": "Painel",
  "/usuarios": "Usuários",
  "/cadastrar": "Instituições",
  "/cadastrar/novo": "Nova Instituição",
  "/caronas": "Registros de Carona",
  "/sugestoes": "Sugestões e Denúncias",
  "/relatorios": "Relatórios",
  "/contratos": "Contratos",
  "/notificacoes": "Emitir Notificação",
  "/auditoria": "Auditoria",
  "/suporte": "Suporte",
};

export function Topbar({ onMenuToggle }) {
  // useLocation: retorna um objeto com informações da URL atual.
  // location.pathname → string com o caminho, ex: '/dashboard'
  const location = useLocation();

  // useNavigate: retorna a função navigate() usada para
  // mudar de rota programaticamente (via código, não clique em link).
  const navigate = useNavigate();

  // useAuth: usuário real + logout. user pode ser null por instantes
  // (entre montagem e chegada do /me); defaults defensivos abaixo.
  const { user, isDev, isAdmin, logout } = useAuth();
  const userName = user?.usu_nome || "Usuário";
  const userEmail = user?.usu_email || "";

  // Busca no dicionário pageNames o título da rota atual.
  // Se a rota não estiver mapeada, usa 'Dashboard' como padrão.
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  const [openMenu, setOpenMenu] = useState(null); // 'notifications' | 'suporte' | 'user' | null
  const [notifCount, setNotifCount] = useState(notificationData.count);

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
    // <header> → elemento HTML semântico para cabeçalhos de seção
    <header className={styles.topbar}>
      {/* Lado esquerdo: hamburger (mobile) + título da página */}
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
        <h1 className={styles.pageTitle}>{currentPageName}</h1>
      </div>

      {/* Lado direito: notificações, usuário e ações */}
      <div className={styles.right} ref={rightRef}>
        {/* Sino de notificações com dropdown de itens recentes */}
        <div className={styles.notificationBell}>
          <button
            className={styles.bellBtn}
            onClick={() => toggleMenu("notifications")}
            aria-label="Notificações"
          >
            <IconBell size={20} />
            {notifCount > 0 && (
              <span className={styles.badge}>{notifCount}</span>
            )}
          </button>

          {openMenu === "notifications" && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notificações</span>
                {notifCount > 0 && (
                  <button
                    className={styles.markReadBtn}
                    onClick={() => setNotifCount(0)}
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {notificationData.items.map((n) => (
                <div key={n.id} className={styles.notifItem}>
                  <span
                    className={`${styles.notifDot} ${notifCount === 0 ? styles.notifDotRead : ""}`}
                  />
                  <div>
                    <p className={styles.notifMessage}>{n.message}</p>
                    <span className={styles.notifTime}>{n.timestamp}</span>
                  </div>
                </div>
              ))}
              {notificationData.items.length === 0 && (
                <p className={styles.emptyMsg}>Nenhuma notificação</p>
              )}
            </div>
          )}
        </div>

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
