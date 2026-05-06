import { useState, useCallback, useEffect } from "react";

const AUTH_KEY = "rtdc.authenticated";

export interface AuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        setIsAuthenticated(localStorage.getItem(AUTH_KEY) === "true");
      } catch {
        setIsAuthenticated(false);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback(() => {
    try {
      localStorage.setItem(AUTH_KEY, "true");
    } catch {
      // ignore — localStorage may be unavailable
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore — localStorage may be unavailable
    }
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
