import { createContext, useContext, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'heb_react_session';

function getInitialSession() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession());

  const login = async (correo, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { correo, password }
    });

    const next = {
      token: data.token,
      usuario: data.usuario
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      usuario: session?.usuario || null,
      token: session?.token || null,
      isAuthenticated: !!session?.token,
      isAdmin: session?.usuario?.rol === 'admin',
      login,
      logout
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
