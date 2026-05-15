/**
 * ============================================================================
 * ARQUIVO: src/pages/Login.jsx
 * DESCRIÇÃO: Página de login da aplicação
 *
 * Esta página:
 * - Permite que o usuário entre com email e senha
 * - Valida as credenciais através da API
 * - Verifica se o usuário tem permissão (ator administrativo ou desenvolvedor)
 * - Armazena token e dados do usuário no localStorage
 * - Redireciona para o dashboard após login bem-sucedido
 *
 * Fluxo de login:
 * 1. Usuário preenche email e senha
 * 2. Clica em "Entrar"
 * 3. handleSubmit é chamado
 * 4. API valida as credenciais (api.login)
 * 5. Se OK, busca dados do perfil (api.getMe)
 * 6. Valida se o usuário é admin/desenvolvedor
 * 7. Armazena token e dados no localStorage
 * 8. Redireciona para /dashboard
 *
 * Interligação:
 * - Usa: api.js (para fazer login)
 * - CSS: Login.module.css
 * - Ícones: lucide-react (Eye, EyeOff)
 * - Routing: useNavigate (do react-router-dom)
 * ============================================================================
 */

// Importa o hook useState para gerenciar estados da página
// Estados: email, senha, se mostra a senha, erro, loading
import { useState } from "react";

// Importa o hook useNavigate para redirecionar após login
import { useNavigate } from "react-router-dom";

// Importa ícones de olho (mostrar/esconder senha)
import { Eye, EyeOff } from "lucide-react";

// Importa a API para fazer requisições (login, getMe, etc)
import { api } from "../services/api";

// Importa estilos CSS da página
import styles from "./Login.module.css";

/**
 * Componente Login
 *
 * Página principal de autenticação
 * @returns JSX com formulário de login
 */
export function Login() {
  // ─────────────────────────────────────────────────────────────────────────
  // ESTADOS
  // ─────────────────────────────────────────────────────────────────────────

  // Email do usuário digitado no input
  const [email, setEmail] = useState("");

  // Senha do usuário digitado no input
  const [password, setPassword] = useState("");

  // Se deve mostrar ou esconder a senha (true = mostra em texto plano)
  const [showPassword, setShowPassword] = useState(false);

  // Mensagem de erro (vazia = sem erro)
  // Se houver erro, mostra na tela para o usuário
  const [error, setError] = useState("");

  // Se está carregando (durante a requisição à API)
  // Usado para desabilitar o botão e mostrar "Entrando..."
  const [loading, setLoading] = useState(false);

  // Hook para redirecionar para outra página
  const navigate = useNavigate();

  /**
   * Função handleSubmit
   *
   * Executada quando o usuário clica em "Entrar"
   * Faz a autenticação e armazena os dados
   *
   * Fluxo:
   * 1. Previne recarregamento da página
   * 2. Limpa erro anterior
   * 3. Ativa loading
   * 4. Tenta fazer login (api.login)
   * 5. Se OK, busca perfil (api.getMe)
   * 6. Valida permissões
   * 7. Armazena dados no localStorage
   * 8. Redireciona para dashboard
   * 9. Se erro, mostra mensagem
   * 10. Desativa loading
   */
  const handleSubmit = async (e) => {
    // Previne o comportamento padrão do formulário (recarregar página)
    e.preventDefault();

    // Limpa erro anterior
    setError("");

    // Ativa loading (mostra "Entrando..." no botão)
    setLoading(true);

    try {
      // Tenta fazer login com email e senha
      // API retorna um token se bem-sucedido
      await api.login(email, password);

      // Busca os dados do perfil do usuário logado
      // Inclui informações como nome, email, tipo de papel (role)
      const profile = await api.getMe();

      // Extrai o "papel" (role) do usuário
      // role: 0 = sem acesso, 1 = admin, 2 = desenvolvedor
      const role = profile?.perfil?.per_tipo ?? profile?.per_tipo ?? 0;

      // Valida se o usuário tem permissão
      // Apenas role >= 1 podem acessar o painel
      if (role < 1) {
        // Logout: remove o token que foi armazenado
        api.logout();

        // Mostra mensagem de erro
        setError(
          "Acesso não autorizado. Apenas administradores e desenvolvedores podem acessar este painel.",
        );
        return;
      }

      // Armazena o papel do usuário no localStorage
      // localStorage: armazenagem local no navegador (persiste ao recarregar)
      localStorage.setItem("user_role", role);

      // Armazena informações do usuário em formato JSON
      // Será usado em outras páginas para mostrar dados do usuário
      localStorage.setItem(
        "user_info",
        JSON.stringify({
          id: profile?.usu_id ?? profile?.usuario?.usu_id,
          nome: profile?.usu_nome ?? profile?.usuario?.usu_nome ?? email,
          email: profile?.usu_email ?? profile?.usuario?.usu_email ?? email,
          role,
        }),
      );

      // Redireciona para o dashboard (página principal)
      navigate("/dashboard");
    } catch (err) {
      // Se houver erro, mostra mensagem
      setError(err.message || "Email ou senha inválidos.");
    } finally {
      // Sempre desativa loading (mesmo se erro)
      setLoading(false);
    }
  };

  return (
    // Container principal da página
    <div className={styles.loginContainer}>
      {/* Card branco com o formulário */}
      <div className={styles.card}>
        {/* Header com logo e título */}
        <div className={styles.header}>
          <h1 className={styles.title}>Tuctuc</h1>
          <p className={styles.subtitle}>Painel Administrativo</p>
        </div>

        {/* Formulário de login */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Campo de Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              E-mail Institucional
            </label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="admin@sistema.dominio"
              value={email}
              // Atualiza o estado quando o usuário digita
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Campo de Senha */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>

            {/* Container com input + botão de mostrar/esconder */}
            <div className={styles.passwordContainer}>
              <input
                // type muda entre 'text' (mostra) e 'password' (esconde)
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.input}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Botão para mostrar/esconder a senha */}
              <button
                type="button"
                className={styles.togglePassword}
                // Alterna entre mostrar e esconder
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Mostra ícone de olho aberto ou fechado */}
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mostra mensagem de erro se houver */}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {/* Botão de envio */}
          <button
            type="submit"
            className={styles.submitBtn}
            // Desabilita o botão durante o carregamento
            disabled={loading}
          >
            {/* Mostra "Entrando..." durante o carregamento */}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.footer}>
          Tuctuc — Plataforma de Caronas Solidárias
        </p>
      </div>
    </div>
  );
}
