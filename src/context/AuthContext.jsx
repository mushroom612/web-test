// ============================================================
// context/AuthContext.jsx — Estado global de autenticação
//
// Fornece para a aplicação inteira:
//   - user: objeto do usuário autenticado (ou null)
//   - role: número 0/1/2 derivado de per_tipo
//          (0 = comum, 1 = Admin escola, 2 = Desenvolvedor)
//   - isAuthenticated: atalho user !== null
//   - loading: enquanto valida o token salvo no localStorage
//   - login(email, password): autentica + valida papel
//   - logout(): encerra a sessão local + invalida no backend
//
// Quem usa: <Login>, <PrivateRoute>, e nas próximas rodadas
// componentes do layout (Aside, Topbar) para exibir o usuário
// logado e respeitar o escopo Admin × Dev.
//
// Hidratação: ao montar, se houver access_token salvo, chama
// /api/usuarios/me; se o token estiver inválido, o http.js
// dispara o evento 'auth:logout' e este provider zera o estado.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { tokens } from '../services/http';

const AuthContext = createContext(null);

// Mensagem mostrada quando um usuário comum tenta logar no painel.
// Centralizada aqui para que Login.jsx não precise duplicar.
const NO_ADMIN_ACCESS_MSG =
  'Acesso não autorizado. Apenas administradores e desenvolvedores podem acessar este painel.';

export function AuthProvider({ children }) {
  // user: dados do perfil autenticado (Usuario da API).
  const [user, setUser] = useState(null);

  // loading: true enquanto verificamos o token salvo (apenas no boot).
  // Importante para o PrivateRoute não redirecionar prematuramente
  // o usuário com token válido para a tela de login.
  const [loading, setLoading] = useState(true);

  // Hidratação inicial: se há token salvo, tenta carregar o perfil.
  // O http.js cuida de refresh em caso de access expirado.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const { access } = tokens.get();
      if (!access) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // Token inválido ou expirado sem refresh válido — limpa e segue.
        tokens.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, []);

  // Escuta o evento global 'auth:logout' (disparado por http.js
  // quando um refresh falha). Mantém a UI em sincronia.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // login: autentica e valida que o usuário pode entrar no painel.
  // Lança Error com mensagem amigável em qualquer falha — quem
  // chama (Login.jsx) só precisa fazer try/catch e mostrar a msg.
  const login = useCallback(async (email, password) => {
    await api.login(email, password);
    const me = await api.getMe();
    const role = Number(me?.per_tipo ?? 0);
    if (role < 1) {
      // Usuário comum tentou entrar no painel: derruba a sessão
      // (no backend e local) e bloqueia.
      await api.logout().catch(() => {});
      throw new Error(NO_ADMIN_ACCESS_MSG);
    }
    setUser(me);
    return me;
  }, []);

  // logout: encerra a sessão. O api.logout() já é tolerante a falhas.
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const role = Number(user?.per_tipo ?? 0);
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role,
    isAdmin: role === 1,
    isDev: role === 2,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth: hook de consumo. Erra cedo se o componente esquecer
// de envolver a árvore com <AuthProvider> — facilita o diagnóstico.
// O comentário abaixo desliga uma checagem de HMR (Fast Refresh)
// que exige arquivos só com componentes; aqui é seguro pois o
// hook está acoplado ao provider acima.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
