import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { canUseDevLogin, useAuth } from '@/auth/AuthProvider';
import { isEntraConfigured } from '@/auth/config';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithDev, loginWithEntra } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <p className="loading-state login-loading">Checking session…</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleDevLogin = () => {
    loginWithDev();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <div className="brand__icon">
            <Shield size={24} />
          </div>
          <div>
            <strong>Comric Fraud Calculator</strong>
            <span>Portal sign-in</span>
          </div>
        </div>

        <h1>Sign in</h1>
        <p>Use your organisational credentials via Microsoft Entra ID. Your JWT includes tenant ID and role claims for API access.</p>

        {isEntraConfigured ? (
          <button type="button" className="btn-primary btn-primary--full" onClick={() => void loginWithEntra()}>
            Sign in with Microsoft
          </button>
        ) : null}

        {canUseDevLogin() ? (
          <button type="button" className="btn-secondary btn-primary--full" onClick={handleDevLogin}>
            Continue with Dev Account
          </button>
        ) : null}

        {!isEntraConfigured && !canUseDevLogin() ? (
          <p className="error-state">Authentication is not configured. Set VITE_AZURE_* or enable dev auth.</p>
        ) : null}
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
