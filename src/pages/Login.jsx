import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import styles from './Login.module.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);

      // Busca o perfil para verificar o papel (role) do usuário
      const profile = await api.getMe();
      const role = profile?.perfil?.per_tipo ?? profile?.per_tipo ?? 0;

      if (role < 1) {
        api.logout();
        setError('Acesso não autorizado. Apenas administradores e desenvolvedores podem acessar este painel.');
        return;
      }

      localStorage.setItem('user_role', role);
      localStorage.setItem('user_info', JSON.stringify({
        id: profile?.usu_id ?? profile?.usuario?.usu_id,
        nome: profile?.usu_nome ?? profile?.usuario?.usu_nome ?? email,
        email: profile?.usu_email ?? profile?.usuario?.usu_email ?? email,
        role
      }));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className={styles.loginContainer}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tuctuc</h1>
          <p className={styles.subtitle}>Painel Administrativo</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={styles.input}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          Tuctuc — Plataforma de Caronas Solidárias
        </p>
      </div>
    </div>
  );
}
