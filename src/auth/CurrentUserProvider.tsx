import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/api/client';
import type { CurrentUser } from '@/types/api';
import { useAuth } from '@/auth/AuthProvider';

interface CurrentUserContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const me = await api.getCurrentUser();
      setCurrentUser(me);
    } catch (err) {
      setCurrentUser(null);
      setError(err instanceof Error ? err.message : 'Failed to load user role');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const can = useCallback(
    (permission: string) => Boolean(currentUser?.permissions?.includes(permission)),
    [currentUser],
  );

  const value = useMemo(
    () => ({ currentUser, loading, error, refresh, can }),
    [currentUser, loading, error, refresh, can],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return ctx;
}
