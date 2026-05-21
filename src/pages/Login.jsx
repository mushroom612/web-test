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
// Serviço usado: api (services/api.js)
//   api.login()  → autentica e salva o token no localStorage
//   api.getMe()  → busca o perfil do usuário recém-logado
//   api.logout() → remove os tokens do localStorage
//
// Estilo: Login.module.css
// ============================================================

// useState: importado do React para criar estados locais.
// Estado = variável que, ao mudar, faz o componente redesenhar.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import styles from './Login.module.css';

export function Login() {
  // ── Estados do formulário ──────────────────────────────────
  // Cada useState retorna [valorAtual, funçãoParaMudar].
  // Quando chamamos setEmail('novo@valor'), o React redesenha
  // o componente com o novo valor de email.

  const [email, setEmail] = useState('');           // valor do campo e-mail
  const [password, setPassword] = useState('');     // valor do campo senha
  const [showPassword, setShowPassword] = useState(false); // senha visível?
  const [error, setError] = useState('');           // mensagem de erro
  const [loading, setLoading] = useState(false);    // aguardando resposta?

  // useNavigate: retorna a função navigate() para trocar de página.
  // Usada após o login bem-sucedido para ir ao /dashboard.
  const navigate = useNavigate();

  // ── Função de submit do formulário ────────────────────────
  // handleSubmit: chamada quando o usuário clica em "Entrar".
  // É uma função assíncrona (async/await) porque precisa
  // esperar a resposta da API antes de continuar.
  const handleSubmit = async (e) => {
    // e.preventDefault() → impede o comportamento padrão do HTML,
    // que seria recarregar a página ao enviar um formulário.
    e.preventDefault();

    setError('');      // limpa erros anteriores
    setLoading(true);  // exibe "Entrando..." no botão

    try {
      // Passo 1: autenticar — a API salva o token no localStorage
      // e retorna os dados do usuário.
      await api.login(email, password);

      // Passo 2: buscar o perfil completo para verificar o papel (role).
      // per_tipo: número que representa o nível de acesso do usuário.
      // O operador "??" (nullish coalescing) usa o valor da direita
      // se o da esquerda for null ou undefined.
      const profile = await api.getMe();
      const role = profile?.perfil?.per_tipo ?? profile?.per_tipo ?? 0;

      // Passo 3: verificar permissão.
      // role < 1 significa usuário comum — sem acesso ao painel.
      if (role < 1) {
        api.logout(); // remove o token que acabou de ser salvo
        setError('Acesso não autorizado. Apenas administradores e desenvolvedores podem acessar este painel.');
        return; // interrompe a execução da função aqui
      }

      // Passo 4: salvar dados do usuário no localStorage para
      // uso posterior em outros componentes (ex: Aside, Topbar).
      // JSON.stringify converte o objeto para texto, pois o
      // localStorage só armazena strings.
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_info', JSON.stringify({
        id: profile?.usu_id ?? profile?.usuario?.usu_id,
        nome: profile?.usu_nome ?? profile?.usuario?.usu_nome ?? email,
        email: profile?.usu_email ?? profile?.usuario?.usu_email ?? email,
        role
      }));

      // Passo 5: redirecionar para o Dashboard.
      navigate('/dashboard');

    } catch (err) {
      // Se qualquer passo acima lançar um erro, cai aqui.
      setError(err.message || 'Email ou senha inválidos.');
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
              value={email}   // valor controlado pelo estado "email"
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
                type={showPassword ? 'text' : 'password'}
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
            {loading ? 'Entrando...' : 'Entrar'}
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
