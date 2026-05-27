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
import { Bell, Settings, LogOut, ChevronDown, Info } from "lucide-react";
import { notificationData } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
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
  "/dashboard": "Dashboard",
  "/usuarios": "Usuários",
  "/cadastrar": "Cadastrar Usuário",
  "/caronas": "Registros de Carona",
  "/sugestoes": "Sugestões e Denúncias",
  "/relatorios": "Relatórios",
  "/contratos": "Contratos",
  "/notificacoes": "Emitir Notificação",
  "/auditoria": "Auditoria",
  "/penalidades": "Penalidades",
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
  const userName = user?.usu_nome || "Usuário";
  const userEmail = user?.usu_email || "";

  // Busca no dicionário pageNames o título da rota atual.
  // Se a rota não estiver mapeada, usa 'Dashboard' como padrão.
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  const [openMenu, setOpenMenu] = useState(null); // 'notifications' | 'settings' | 'user' | null
  const [notifCount, setNotifCount] = useState(notificationData.count);
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

  const toggleMenu = (menu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // handleLogout: encerra a sessão (limpa tokens + notifica backend)
  // e navega para o login. await garante que o estado já foi zerado
  // quando o redirecionamento acontece — evita "piscar" o painel.
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    // <header> → elemento HTML semântico para cabeçalhos de seção
    <header className={styles.topbar}>
      {/* Lado esquerdo: título da página atual */}
      <div className={styles.left}>
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
            <Bell size={20} />
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
            <ChevronDown
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
                <LogOut size={15} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão de configurações com dropdown informativo */}
        <div className={styles.settingsWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => toggleMenu("settings")}
            aria-label="Configurações"
          >
            <Settings size={20} />
          </button>

          {openMenu === "settings" && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownInfoBlock}>
                <Info size={14} />
                <div>
                  <p className={styles.appName}>CaronaCity Admin</p>
                  <p className={styles.appVersion}>Versão 1.0.0 — TCC 2026</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão de logout — chama handleLogout ao ser clicado */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
