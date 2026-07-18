import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, clearToken, getToken, setToken } from './api';
import type { Admin } from './types';

interface AuthValue {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // A stored token may have expired, or the account may since have been
  // disabled, so it is verified against the server rather than trusted.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<Admin>('/admin/auth/me')
      .then(setAdmin)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; admin: Admin }>(
      '/admin/auth/login',
      { email, password }
    );
    setToken(result.token);
    setAdmin(result.admin);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, signIn, signOut }),
    [admin, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
