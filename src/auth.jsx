import { createContext, useContext, useEffect, useState } from "react";
import { api, loginPerfil } from "./api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api("/sessao", { quiet401: true })
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      setUser(null);
    };
    window.addEventListener("aegis:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("aegis:session-expired", expired);
    };
  }, []);
  async function login(email, senha, perfil) {
    const u = await loginPerfil(email, senha, perfil);
    setUser(u);
    return u;
  }
  async function logout() {
    await api("/sessao", { method: "DELETE" });
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
