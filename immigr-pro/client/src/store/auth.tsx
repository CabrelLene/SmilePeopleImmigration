// src/store/auth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken } from "../api";

export type User = {
  _id: string;
  email: string;
  fullName?: string;
  name?: string;
  role?: "user" | "admin";
  photoUrl?: string;
};

type AuthContextShape = {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  // Restaure la session depuis localStorage (si présente)
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) {
      setTokenState(t);
      setToken(t); // informe le client API
    }
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = (tok: string, usr: User, remember = true) => {
    setTokenState(tok);
    setUser(usr);
    setToken(tok); // met à jour l'Authorization du client API
    if (remember) {
      localStorage.setItem("token", tok);
      localStorage.setItem("user", JSON.stringify(usr));
    }
  };

  const login = async (email: string, password: string, remember = true): Promise<User> => {
    const { token: tok, user: usr } = await api.login(email, password);
    persist(tok, usr, remember);
    return usr; // <-- renvoie l'utilisateur
  };

  const register = async (fullName: string, email: string, password: string): Promise<User> => {
    const { token: tok, user: usr } = await api.register({ fullName, email, password });
    persist(tok, usr, true);
    return usr; // <-- renvoie l'utilisateur
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    setToken(""); // vide le token côté client API
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value: AuthContextShape = useMemo(
    () => ({
      user,
      token,
      isAdmin: (user?.role || "").toLowerCase() === "admin",
      login,
      register,
      logout,
      setUser,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
