// ============================================================
// pages/Login.jsx — Tela de Login do painel administrativo
//
// Esta é a primeira página que o usuário vê ao acessar o sistema.
// Ela coleta email e senha, chama a API para autenticar,
// verifica se o usuário tem permissão de admin/desenvolvedor
// e, em caso de sucesso, redireciona para o Dashboard.
//
// Bibliotecas usadas:
//   - react:
//       useState  → hook para criar variáveis "reativas".
//                   Quando uma variável de estado muda, o
//                   componente re-renderiza automaticamente.
//   - react-router-dom:
//       useNavigate → hook que devolve a função navigate(),
//                     usada para mudar de rota via código.
//   - lucide-react:
//       Eye / EyeOff → ícones de olho para mostrar/esconder senha
//
// Serviço usado: useAuth (context/AuthContext.jsx)
//   login(email, senha) → autentica via API, salva tokens
//                         e valida que o usuário é Admin/Dev
//   isAuthenticated     → se já há sessão ativa, pula o form
//
// Estilo: Login.module.css
// ============================================================

// useState: importado do React para criar estados locais.
// Estado = variável que, ao mudar, faz o componente redesenhar.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export function Login() {
  // ── Estados do formulário ──────────────────────────────────
  // Cada useState retorna [valorAtual, funçãoParaMudar].
  // Quando chamamos setEmail('novo@valor'), o React redesenha
  // o componente com o novo valor de email.

  const [email, setEmail] = useState(""); // valor do campo e-mail
  const [password, setPassword] = useState(""); // valor do campo senha
  const [showPassword, setShowPassword] = useState(false); // senha visível?
  const [error, setError] = useState(""); // mensagem de erro
  const [loading, setLoading] = useState(false); // aguardando resposta?

  // useNavigate: retorna a função navigate() para trocar de página.
  // Usada após o login bem-sucedido para ir ao /dashboard.
  const navigate = useNavigate();

  // useAuth: estado global de autenticação. Aqui consumimos:
  //   login()           → realiza autenticação + validação de papel
  //   isAuthenticated   → se já há sessão ativa
  //   loading (do auth) → indica que o boot ainda está validando o token
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  // Se o usuário já está autenticado (ex: voltou da tela interna
  // ou recarregou a aba com token válido), pula direto para o Painel.
  // Esperamos o boot do AuthContext terminar antes de decidir.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/painel", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // ── Função de submit do formulário ────────────────────────
  // handleSubmit: chamada quando o usuário clica em "Entrar".
  // Toda a lógica (autenticar, buscar perfil, validar papel) está
  // no AuthContext — aqui só tratamos UI/erros.
  const handleSubmit = async (e) => {
    // e.preventDefault() → impede o comportamento padrão do HTML,
    // que seria recarregar a página ao enviar um formulário.
    e.preventDefault();

    setError(""); // limpa erros anteriores
    setLoading(true); // exibe "Entrando..." no botão

    try {
      // login() do AuthContext já cuida de:
      //   1. POST /api/usuarios/login (salva tokens)
      //   2. GET /api/usuarios/me (carrega perfil)
      //   3. Bloquear usuários comuns (role < 1) com mensagem clara
      await login(email, password);
      navigate("/painel");
    } catch (err) {
      // Erros possíveis: 401 (credenciais), 403 (sem acesso ao painel),
      // rede fora (TypeError). Mensagem amigável já vem pronta do
      // ApiError ou da validação de papel.
      setError(err.message || "Email ou senha inválidos.");
    } finally {
      // "finally" sempre executa — com sucesso ou erro.
      // Restaura o botão ao estado normal.
      setLoading(false);
    }
  };

  // ── JSX (estrutura visual do componente) ──────────────────
  return (
    <div className={styles.loginContainer}>
      <div className={styles.card}>
        {/* Cabeçalho do card com título e subtítulo */}
        <div className={styles.header}>
          <h1 className={styles.title}>Tuctuc</h1>
          <p className={styles.subtitle}>Painel Administrativo</p>
        </div>

        {/* Formulário de login.
            onSubmit={handleSubmit} → ao clicar em "Entrar" ou
            pressionar Enter, a função handleSubmit é chamada. */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Campo de e-mail */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              E-mail Institucional
            </label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="admin@sistema.dominio"
              value={email} // valor controlado pelo estado "email"
              onChange={(e) => setEmail(e.target.value)} // atualiza o estado a cada tecla
            />
          </div>

          {/* Campo de senha com botão para mostrar/esconder */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <div className={styles.passwordContainer}>
              {/* type muda entre 'text' e 'password' conforme
                  o estado showPassword — isso mostra/esconde o texto */}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.input}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Botão de toggle: alterna showPassword entre true/false.
                  O ícone muda conforme o estado atual. */}
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mensagem de erro — só renderiza se "error" tiver conteúdo.
              O && (AND lógico) faz renderização condicional:
              se error for string vazia (''), não renderiza nada. */}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {/* Botão de submit.
              disabled={loading} → desabilita o botão enquanto
              aguarda resposta da API (evita cliques duplos). */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Rodapé do card */}
        <p className={styles.footer}>
          Tuctuc — Plataforma de Caronas Solidárias
        </p>
      </div>
    </div>
  );
}
