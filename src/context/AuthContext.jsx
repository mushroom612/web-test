import {createContext, useState, useCallback} from "react";

export const AuthContext = createContext();

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);

  const login = useCallback((email, password) => {
    // Credenciais válidas
    const validUsers = {
      "admin@universidad.edu.br": {role: "admin", name: "João Silva"},
      "dev@universidad.edu.br": {role: "developer", name: "Dev User"},
    };

    const userData = validUsers[email];

    if (userData && password === "123456") {
      setUser({
        id: Math.random(),
        name: userData.name,
        email: email,
        role: userData.role,
      });
      return userData.role;
    }

    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{user, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}
