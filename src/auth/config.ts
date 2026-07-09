import { LogLevel, PublicClientApplication, type Configuration } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID ?? '';
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID ?? '';
const apiScope = import.meta.env.VITE_AZURE_API_SCOPE ?? '';

export const useDevAuth = import.meta.env.VITE_USE_DEV_AUTH !== 'false';
export const isEntraConfigured = Boolean(tenantId && clientId && apiScope);

export const msalConfig: Configuration | null = isEntraConfigured
  ? {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
      system: {
        loggerOptions: {
          logLevel: LogLevel.Warning,
        },
      },
    }
  : null;

export const loginRequest = isEntraConfigured
  ? { scopes: [apiScope, 'openid', 'profile'] }
  : { scopes: [] as string[] };

export const msalInstance = msalConfig ? new PublicClientApplication(msalConfig) : null;

const TOKEN_KEY = 'comric.accessToken';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export const DEV_TOKEN = 'dev-token';
