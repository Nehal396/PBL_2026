import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setCsrfToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api("/auth/me")
      .then(({ user: currentUser, csrf }) => {
        setUser(currentUser);
        setCsrfToken(csrf);
      })
      .catch((error) => {
        if (error.status !== 401) console.error("Could not restore the Rentix session:", error);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async signIn(credentials) {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
      setUser(result.user);
      setCsrfToken(result.csrf);
      return result.user;
    },
    async register(values) {
      const result = await api("/auth/register", { method: "POST", body: JSON.stringify(values) });
      setUser(result.user);
      setCsrfToken(result.csrf);
      return result.user;
    },
    async signOut() {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setCsrfToken("");
    },
    updateUser(updatedUser) {
      setUser(updatedUser);
    }
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
