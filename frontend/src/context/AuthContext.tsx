import { useState, useCallback, type ReactNode } from "react";
import { AuthContext, type User } from "./auth-context";

interface AuthState {
  token: string | null;
  user: User | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem("user-mgmt-auth");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { token: null, user: null };
      }
    }
    return { token: null, user: null };
  });

  const login = useCallback((token: string, user: User) => {
    const newState = { token, user };
    setState(newState);
    localStorage.setItem("user-mgmt-auth", JSON.stringify(newState));
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null });
    localStorage.removeItem("user-mgmt-auth");
  }, []);

  const isAdmin = useCallback(() => {
    return state.user?.role === "ADMIN";
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
