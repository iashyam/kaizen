import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authLogin, authSignup, authMe, type User } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    authMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authLogin({ email, password });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const res = await authSignup({ email, password, name });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
