import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, IconChevronLeft } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import styles from './Login.module.css';

export function Login() {
  // ── Login ──────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Recuperação de senha ───────────────────────────────
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1=email 2=otp 3=nova senha 4=sucesso
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/painel', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Auto-foca primeiro box ao entrar na etapa do OTP
  useEffect(() => {
    if (mode === 'forgot' && forgotStep === 2) {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [mode, forgotStep]);

  // Redireciona automaticamente ao login após sucesso
  useEffect(() => {
    if (forgotStep === 4) {
      const t = setTimeout(() => {
        setMode('login');
        setForgotStep(1);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [forgotStep]);

  // ── Handlers — login ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/painel');
    } catch (err) {
      setError(err.message || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers — recuperação ────────────────────────────
  function enterForgotMode() {
    setMode('forgot');
    setForgotStep(1);
    setForgotEmail('');
    setOtpValues(['', '', '', '', '', '']);
    setNewPassword('');
    setForgotError('');
  }

  function handleForgotBack() {
    setForgotError('');
    if (forgotStep === 1) {
      setMode('login');
    } else {
      setForgotStep((s) => s - 1);
    }
  }

  async function handleForgotEmailSubmit(e) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Erro ao enviar o código. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length < 6) {
      setForgotError('Digite todos os 6 dígitos do código.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.verificarOtpReset(forgotEmail, otp);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'Código inválido ou expirado.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setForgotError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.resetPassword(forgotEmail, otpValues.join(''), newPassword);
      setForgotStep(4);
    } catch (err) {
      setForgotError(err.message || 'Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Handlers — inputs OTP ─────────────────────────────
  function handleOtpChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpValues];
    next[index] = digit;
    setOtpValues(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtpValues(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  // ── JSX ───────────────────────────────────────────────
  return (
    <div className={styles.loginContainer}>

      {/* Painel esquerdo — hero */}
      <div className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogoWrap}>
            <img src="/favicon.svg" alt="Tuctuc" className={styles.heroLogoImg} />
          </div>
          <h2 className={styles.heroTitle}>Tuctuc</h2>
          <p className={styles.heroTagline}>Caronas solidárias</p>
        </div>
      </div>

      {/* Painel direito */}
      <div className={styles.formPanel}>
        <div className={styles.formContent}>

          {mode === 'login' ? (
            <>
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
                    autoFocus
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
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.forgotRow}>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={enterForgotMode}
                  >
                    Esqueci a senha
                  </button>
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </>
          ) : (
            <>
              {forgotStep < 4 && (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={handleForgotBack}
                >
                  <IconChevronLeft size={16} />
                  Voltar
                </button>
              )}

              <div className={styles.logoBlock}>
                <span className={styles.logoName}>
                  {forgotStep === 1 && 'Recuperar senha'}
                  {forgotStep === 2 && 'Verificar código'}
                  {forgotStep === 3 && 'Nova senha'}
                </span>
                {forgotStep < 4 && (
                  <span className={styles.subtitle}>Painel Administrativo</span>
                )}
              </div>

              {/* Etapa 1 — e-mail */}
              {forgotStep === 1 && (
                <form className={styles.form} onSubmit={handleForgotEmailSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="forgotEmail" className={styles.label}>
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      id="forgotEmail"
                      className={styles.input}
                      placeholder="admin@sistema.dominio"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  {forgotError && <p className={styles.errorMsg}>{forgotError}</p>}
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={forgotLoading || !forgotEmail}
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar código'}
                  </button>
                </form>
              )}

              {/* Etapa 2 — OTP */}
              {forgotStep === 2 && (
                <form className={styles.form} onSubmit={handleOtpSubmit}>
                  <p className={styles.otpEmailLabel}>
                    Código enviado para <strong>{forgotEmail}</strong>
                  </p>
                  <div className={styles.otpRow} onPaste={handleOtpPaste}>
                    {otpValues.map((val, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`${styles.otpBox}${val ? ` ${styles.otpFilled}` : ''}`}
                        value={val}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      />
                    ))}
                  </div>
                  <p className={styles.otpHint}>O código expira em 15 minutos</p>
                  {forgotError && <p className={styles.errorMsg}>{forgotError}</p>}
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={forgotLoading || otpValues.join('').length < 6}
                  >
                    {forgotLoading ? 'Verificando...' : 'Verificar código'}
                  </button>
                </form>
              )}

              {/* Etapa 3 — nova senha */}
              {forgotStep === 3 && (
                <form className={styles.form} onSubmit={handleResetPasswordSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="newPassword" className={styles.label}>
                      Nova senha
                    </label>
                    <div className={styles.passwordContainer}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        className={styles.input}
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                  </div>
                  {forgotError && <p className={styles.errorMsg}>{forgotError}</p>}
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Redefinindo...' : 'Redefinir senha'}
                  </button>
                </form>
              )}

              {/* Etapa 4 — sucesso */}
              {forgotStep === 4 && (
                <div className={styles.successBlock}>
                  <div className={styles.successIcon}>✓</div>
                  <p className={styles.successTitle}>Senha redefinida!</p>
                  <p className={styles.successText}>
                    Você será redirecionado para o login...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
