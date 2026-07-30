import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { canUseDevLogin, useAuth } from '@/auth/AuthProvider';
import { isEntraConfigured } from '@/auth/config';
import { consumeAuthError } from '@/auth/organization';

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithDev, loginWithEntra } = useAuth();
  const [error, setError] = useState<string | null>(() => consumeAuthError());

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [signingIn, setSigningIn] = useState(false);

  if (isLoading) {
    return <p className="loading-state login-loading">Checking session…</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await loginWithEntra();
    } catch (err) {
      setSigningIn(false);
      setError(err instanceof Error ? err.message : 'Microsoft sign-in failed.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__glow" aria-hidden />
      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__icon">
            <Shield size={26} strokeWidth={2.2} />
          </div>
          <div className="login-card__brand-text">
            <strong className="login-card__product">Comric Fraud Calculator</strong>
            <span className="login-card__subtitle">Portal sign-in</span>
          </div>
        </div>

        <div className="login-card__body">
          <h1>Sign in</h1>
          <p>Use your work account on the Microsoft login page to continue.</p>

          {isEntraConfigured ? (
            <button
              type="button"
              className="btn-primary btn-primary--full btn-microsoft"
              disabled={signingIn}
              onClick={() => void handleMicrosoftLogin()}
            >
              <MicrosoftLogo />
              <span>{signingIn ? 'Redirecting…' : 'Sign in with Microsoft'}</span>
            </button>
          ) : null}

          {canUseDevLogin() ? (
            <button type="button" className="btn-secondary btn-primary--full" onClick={() => loginWithDev()}>
              Continue with Dev Account
            </button>
          ) : null}

          {!isEntraConfigured && !canUseDevLogin() ? (
            <p className="error-state">
              Microsoft sign-in is not configured. Set VITE_AZURE_TENANT_ID, VITE_AZURE_CLIENT_ID, and
              VITE_AZURE_API_SCOPE.
            </p>
          ) : null}

          {error ? <p className="error-state">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p className="loading-state login-loading">Checking session…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
