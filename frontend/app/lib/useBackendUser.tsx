'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserSchema } from './backendTypes';
import { userInfo, userLogin, userLogout, userRegister } from './backendApi';

type BackendUserContextValue = {
  user: UserSchema | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const BackendUserContext = createContext<BackendUserContextValue | null>(null);

export function BackendUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const u = await userInfo();
      setUser(u);
      setError(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await userLogin(email, password);
    setUser(u);
    setError(null);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const u = await userRegister(username, email, password);
    setUser(u);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    await userLogout();
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      login,
      register,
      logout,
    }),
    [user, loading, error, refreshUser, login, register, logout],
  );

  return <BackendUserContext.Provider value={value}>{children}</BackendUserContext.Provider>;
}

export function useBackendUser() {
  const ctx = useContext(BackendUserContext);
  if (!ctx) throw new Error('useBackendUser deve ser usado dentro de BackendUserProvider');
  return ctx;
}
