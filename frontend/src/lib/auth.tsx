"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: "SUPER_ADMIN" | "CLUB_ADMIN" | "EDITOR" | "FAN";
  membership: "NONE" | "ACTIVE" | "EXPIRED";
  membershipUntil?: string | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string | undefined, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("club_token");
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem("club_token");
  else window.localStorage.setItem("club_token", token);
}

async function apiJson<T>(path: string, method: string, body?: any, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    setIsLoading(false);
  }, []);

  const refresh = async () => {
    const t = getStoredToken();
    if (!t) {
      setToken(null);
      setUser(null);
      return;
    }
    setToken(t);
    const data = await apiJson<{ user: AuthUser }>("/auth/me", "GET", undefined, t);
    setUser(data.user);
  };

  useEffect(() => {
    // fetch /me once token is available
    if (!token) return;
    refresh().catch(() => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiJson<{ token: string; user: AuthUser }>("/auth/login", "POST", { email, password });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string | undefined, email: string, password: string) => {
    const data = await apiJson<{ token: string; user: AuthUser }>("/auth/register", "POST", { name, email, password });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthState>(
    () => ({ token, user, isLoading, login, register, logout, refresh }),
    [token, user, isLoading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
