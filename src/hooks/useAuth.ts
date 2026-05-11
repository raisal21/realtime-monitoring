import { useState, useCallback, useEffect } from "react";
import type { Role, StoredAuth } from "./auth.types";

const AUTH_KEY = "rtdc.auth";

export interface AuthState {
  isAuthenticated: boolean;
  operatorName: string | null;
  role: Role | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
}

function readAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (
      typeof parsed?.authenticated !== "boolean" ||
      typeof parsed?.operatorName !== "string" ||
      typeof parsed?.role !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useAuth(): AuthState {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readAuth());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== null && e.key !== AUTH_KEY) return;
      setAuth(readAuth());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback((email: string, role: Role) => {
    const blob: StoredAuth = {
      authenticated: true,
      operatorName: email,
      role,
    };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(blob));
    } catch {
      // ignore — localStorage may be unavailable
    }
    setAuth(blob);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore — localStorage may be unavailable
    }
    setAuth(null);
  }, []);

  return {
    isAuthenticated: auth?.authenticated === true,
    operatorName: auth?.operatorName ?? null,
    role: auth?.role ?? null,
    login,
    logout,
  };
}
