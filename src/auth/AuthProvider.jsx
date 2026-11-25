import { useCallback, useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { AuthContext } from "./AuthContext";

const KEY = "costalago.session";

export function AuthProvider({ children }) {
  const { state, actions } = useStore();
  const [userId, setUserId] = useState(() => {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  });

  const user = useMemo(() => state.users.find((u) => u.id === userId) ?? null, [state.users, userId]);

  const login = useCallback(
    (email, password) => {
      const found = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      if (!found) return { ok: false, error: "Correo o contraseña incorrectos." };
      try {
        sessionStorage.setItem(KEY, found.id);
      } catch {
      }
      setUserId(found.id);
      return { ok: true };
    },
    [state.users]
  );

  const register = useCallback(
    (data) => {
      const result = actions.registerUser(data);
      if (!result.ok) return result;
      try {
        sessionStorage.setItem(KEY, result.user.id);
      } catch {
      }
      setUserId(result.user.id);
      return { ok: true };
    },
    [actions]
  );

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
    }
    setUserId(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout, register }), [user, login, logout, register]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
