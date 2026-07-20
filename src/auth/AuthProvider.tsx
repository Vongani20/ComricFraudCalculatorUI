import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MsalProvider } from '@azure/msal-react';
import {
  clearStoredToken,
  DEV_TOKEN,
  getStoredToken,
  isEntraConfigured,
  loginRequest,
  msalInstance,
  setStoredToken,
  useDevAuth,
} from '@/auth/config';
import { acquireAccessToken } from '@/auth/token';
import {
  isAllowedOrganizationAccount,
  organizationAccessDeniedMessage,
  setAuthError,
} from '@/auth/organization';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithDev: () => void;
  loginWithEntra: () => Promise<void>;
  logout: () => Promise<void>;
  accountName: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(isEntraConfigured);

  useEffect(() => {
    if (!isEntraConfigured || !msalInstance) {
      setIsLoading(false);
      return;
    }

    const instance = msalInstance;
    if (!instance) {
      setIsLoading(false);
      return;
    }

    instance
      .initialize()
      .then(async () => {
        const result = await instance.handleRedirectPromise();
        if (result?.account) {
          instance.setActiveAccount(result.account);
        }

        const accounts = instance.getAllAccounts();
        if (accounts.length === 0) {
          return;
        }

        const activeAccount = result?.account ?? accounts[0];
        instance.setActiveAccount(activeAccount);

        if (!isAllowedOrganizationAccount(activeAccount)) {
          setAuthError(organizationAccessDeniedMessage());
          clearStoredToken();
          setToken(null);
          await instance.logoutRedirect({ account: activeAccount });
          return;
        }

        try {
          const apiToken = await acquireAccessToken();
          setStoredToken(apiToken);
          setToken(apiToken);
        } catch {
          clearStoredToken();
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithDev = useCallback(() => {
    setStoredToken(DEV_TOKEN);
    setToken(DEV_TOKEN);
  }, []);

  const loginWithEntra = useCallback(async () => {
    if (!msalInstance) {
      throw new Error('Microsoft sign-in is not configured.');
    }
    await msalInstance.initialize();
    await msalInstance.loginRedirect(loginRequest);
  }, []);

  const logout = useCallback(async () => {
    clearStoredToken();
    setToken(null);
    if (msalInstance) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await msalInstance.logoutRedirect({ account: accounts[0] });
      }
    }
  }, []);

  const accountName = useMemo(() => {
    if (token === DEV_TOKEN) return 'Fraud Analyst (Dev)';
    const account = msalInstance?.getAllAccounts()[0];
    return account?.name ?? account?.username ?? null;
  }, [token]);

  const activeToken = token ?? getStoredToken();

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(activeToken),
      isLoading,
      loginWithDev,
      loginWithEntra,
      logout,
      accountName,
    }),
    [activeToken, isLoading, loginWithDev, loginWithEntra, logout, accountName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isEntraConfigured && msalInstance) {
    return (
      <MsalProvider instance={msalInstance}>
        <AuthStateProvider>{children}</AuthStateProvider>
      </MsalProvider>
    );
  }

  return <AuthStateProvider>{children}</AuthStateProvider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function canUseDevLogin(): boolean {
  return useDevAuth;
}
