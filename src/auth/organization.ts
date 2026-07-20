import type { AccountInfo } from '@azure/msal-browser';

export const ALLOWED_EMAIL_DOMAIN = (
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'solugrowth.com'
).toLowerCase();

export const AUTH_ERROR_KEY = 'comric.authError';

export function setAuthError(message: string): void {
  sessionStorage.setItem(AUTH_ERROR_KEY, message);
}

export function consumeAuthError(): string | null {
  const message = sessionStorage.getItem(AUTH_ERROR_KEY);
  if (message) {
    sessionStorage.removeItem(AUTH_ERROR_KEY);
  }
  return message;
}

export function getAccountEmail(account: AccountInfo): string | null {
  return account.username?.trim().toLowerCase() ?? null;
}

export function isAllowedOrganizationAccount(account: AccountInfo): boolean {
  const email = getAccountEmail(account);
  if (!email) {
    return false;
  }

  return email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export function organizationAccessDeniedMessage(): string {
  return `Only @${ALLOWED_EMAIL_DOMAIN} accounts can sign in.`;
}
