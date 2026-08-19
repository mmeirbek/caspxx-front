import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  initSessionRefresh,
  login,
  logout,
  register,
  restoreSession,
  setSessionClearedHandler,
} from "@/lib/auth/session";
import type { RegisterPayload } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import type { AuthContextValue } from "@/lib/auth/types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSessionRefresh();
    setSessionClearedHandler(() => setUser(null));
    void restoreSession().then((restored) => {
      setUser(restored);
      setLoading(false);
    });
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const loggedIn = await login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    return register(payload);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
    }),
    [user, loading, handleLogin, handleRegister, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
