<<<<<<< Updated upstream
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import styles from './Login.module.css';
=======
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Eye, EyeOff} from "lucide-react";
import {useAuth} from "../hooks/useAuth";
import styles from "./Login.module.css";
>>>>>>> Stashed changes

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {login} = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< Updated upstream
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
=======
    console.log('Email:', email);
    console.log('Password:', password);
    const role = login(email, password);
    console.log('Role retornado:', role);
    if (role) {
      navigate("/dashboard");
    } else {
      alert("Credenciais inválidas");
>>>>>>> Stashed changes
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tuctuc</h1>
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
<<<<<<< Updated upstream
              placeholder="admin@sistema.inova.br"
=======
              placeholder="admin@universidad.edu.br ou dev@universidad.edu.br"
>>>>>>> Stashed changes
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
                required
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
