import { LogLevel, PublicClientApplication, type Configuration, type RedirectRequest } from '@azure/msal-browser';
import { ALLOWED_EMAIL_DOMAIN } from '@/auth/organization';

const tenantId = (import.meta.env.VITE_AZURE_TENANT_ID ?? '') as string;
const clientId = (import.meta.env.VITE_AZURE_CLIENT_ID ?? '') as string;
const apiScope = (import.meta.env.VITE_AZURE_API_SCOPE ?? '') as string;
const apiScopesCsv = (import.meta.env.VITE_AZURE_API_SCOPES ?? '') as string;

/** Dev bypass only when explicitly enabled (local). Production builds set this to false. */
export const useDevAuth = import.meta.env.VITE_USE_DEV_AUTH === 'true';
export const isEntraConfigured = Boolean(tenantId && clientId && (apiScope || apiScopesCsv));

function resolveApiScopes(): string[] {
  if (apiScopesCsv.trim()) {
    return apiScopesCsv
      .split(/[,\s]+/)
      .map((scope: string) => scope.trim())
      .filter(Boolean);
  }

  if (!apiScope) return [];

  return apiScope
    .split(/\s+/)
    .map((scope: string) => scope.trim())
    .filter(Boolean);
}

export const apiScopes = resolveApiScopes();

export const msalConfig: Configuration | null = isEntraConfigured
  ? {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
        postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
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

/** Forces Microsoft's email/password (or MFA) sign-in UI. */
export const loginRequest: RedirectRequest = {
  scopes: apiScopes,
  prompt: 'login',
  extraQueryParameters: {
    domain_hint: ALLOWED_EMAIL_DOMAIN,
  },
};

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
