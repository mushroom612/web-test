import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Painel esquerdo — hero */}
      <div className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogoWrap}>
            <img
              src="/favicon.svg"
              alt="Tuctuc"
              className={styles.heroLogoImg}
            />
          </div>
          <h2 className={styles.heroTitle}>Tuctuc</h2>
          <p className={styles.heroTagline}>Caronas solidárias</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className={styles.formPanel}>
        <div className={styles.formContent}>
          <div className={styles.logoBlock}>
            <span className={styles.logoName}>Tuctuc</span>
            <span className={styles.subtitle}>Painel Administrativo</span>
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
                autoFocus={true}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
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

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
