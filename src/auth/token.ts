import { InteractionRequiredAuthError } from '@azure/msal-browser';
import {
  apiScopes,
  DEV_TOKEN,
  getStoredToken,
  isEntraConfigured,
  msalInstance,
  setStoredToken,
  useDevAuth,
} from '@/auth/config';
import {
  isAllowedOrganizationAccount,
  organizationAccessDeniedMessage,
} from '@/auth/organization';

/** Acquire a fresh access token for this API (MSAL silent, redirect if needed). */
export async function acquireAccessToken(): Promise<string> {
  if (!isEntraConfigured) {
    const dev = getStoredToken() ?? (useDevAuth ? DEV_TOKEN : null);
    if (!dev) {
      throw new Error('Not signed in.');
    }
    return dev;
  }

  if (!msalInstance) {
    throw new Error('Microsoft sign-in is not configured.');
  }

  await msalInstance.initialize();
  const account = msalInstance.getAllAccounts()[0];
  if (!account) {
    throw new Error('Not signed in.');
  }

  if (!isAllowedOrganizationAccount(account)) {
    throw new Error(organizationAccessDeniedMessage());
  }

  const silentRequest = { scopes: apiScopes, account };

  try {
    const result = await msalInstance.acquireTokenSilent(silentRequest);
    if (!result.accessToken) {
      throw new Error('No access token returned from Microsoft sign-in.');
    }
    setStoredToken(result.accessToken);
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(silentRequest);
      throw new Error('Redirecting to Microsoft sign-in…');
    }
    throw error;
  }
}
