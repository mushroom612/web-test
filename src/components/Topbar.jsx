/**
 * ============================================================================
 * ARQUIVO: src/components/Topbar.jsx
 * DESCRIÇÃO: Componente do header superior (topbar)
 *
 * O Topbar mostra:
 * - Título da página atual (muda conforme a rota)
 * - Ícone de notificações com contador
 * - Perfil do usuário logado
 * - Botões de configurações e logout
 *
 * Como funciona:
 * 1. useLocation pega a URL atual
 * 2. Converte a URL em um nome amigável usando o objeto pageNames
 * 3. Renderiza o header com informações do usuário e ações
 *
 * Interligação:
 * - Usado em: AdminLayout.jsx e DesenLayout.jsx
 * - Dados: mockData.js (adminUser, notificationData)
 * - CSS: Topbar.module.css
 * ============================================================================
 */

// Importa hooks do React Router
// useLocation: obtém a URL/rota atual
// useNavigate: permite redirecionar para outra página
import { useLocation, useNavigate } from "react-router-dom";

// Importa ícones
import { Bell, Settings, LogOut } from "lucide-react";

// Importa dados mock (usuário e notificações)
import { adminUser, notificationData } from "../data/mockData";

// Importa estilos CSS
import styles from "./Topbar.module.css";

/**
 * Mapeamento de URLs para nomes amigáveis
 *
 * Quando o usuário está em /dashboard, mostra "Dashboard"
 * Quando está em /usuarios, mostra "Usuários"
 * etc
 *
 * Chave: URL/rota
 * Valor: nome que aparece no header
 */
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

/**
 * Componente Topbar
 *
 * Header superior com informações e ações do usuário
 * @returns {JSX} - Header com título, notificações e botões
 */
export function Topbar() {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ─────────────────────────────────────────────────────────────────────────

  // Obtém informações sobre a localização/rota atual
  const location = useLocation();

  // Para navegar entre páginas
  const navigate = useNavigate();

  // Pega o nome da página atual (ex: /dashboard → "Dashboard")
  // Se não encontrar a rota, usa 'Dashboard' como padrão
  const currentPageName = pageNames[location.pathname] || "Dashboard";

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÕES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Função handleLogout
   *
   * Redireciona para a página de login (/)
   * Note: useNavigate não limpa o localStorage, apenas navega
   * O PrivateRoute em routes.jsx vai detectar a falta de token e redirecionar
   */
  const handleLogout = () => {
    navigate("/");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO
  // ─────────────────────────────────────────────────────────────────────────

  return (
    // Header principal
    <header className={styles.topbar}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LADO ESQUERDO: TÍTULO DA PÁGINA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={styles.left}>
        {/* Mostra o título da página atual */}
        <h1 className={styles.pageTitle}>{currentPageName}</h1>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LADO DIREITO: NOTIFICAÇÕES, USUÁRIO, BOTÕES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={styles.right}>
        {/* Seção de notificações */}
        <div className={styles.notificationBell}>
          <button className={styles.bellBtn}>
            {/* Ícone de sino */}
            <Bell size={20} />

            {/* Badge com número de notificações (só mostra se tiver) */}
            {notificationData.count > 0 && (
              <span className={styles.badge}>{notificationData.count}</span>
            )}
          </button>
        </div>

        {/* Seção de perfil do usuário */}
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            {/* Avatar (emoji) do usuário */}
            <span className={styles.userAvatar}>{adminUser.avatar}</span>

            {/* Nome do usuário */}
            <span className={styles.userName}>{adminUser.name}</span>
          </div>
        </div>

        {/* Botão de configurações (Settings) */}
        <button className={styles.iconBtn}>
          <Settings size={20} />
        </button>

        {/* Botão de logout */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
