import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { CurrentUserProvider, useCurrentUser } from '@/auth/CurrentUserProvider';
import { AppLayout } from '@/components/AppLayout';
import { ActivityLogPage } from '@/pages/ActivityLogPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FraudSignalsPage } from '@/pages/FraudSignalsPage';
import { HrEventsPage } from '@/pages/HrEventsPage';
import { IdLookupPage } from '@/pages/IdLookupPage';
import { LoginPage, RequireAuth } from '@/pages/LoginPage';
import { MnoEventsPage } from '@/pages/MnoEventsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ErrorState, LoadingState } from '@/components/ui';
import type { ReactNode } from 'react';

function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can, loading, currentUser } = useCurrentUser();

  if (loading) return <LoadingState />;
  if (!currentUser?.hasAccess) {
    return (
      <ErrorState message="Your account is not assigned a role for this tenant. Ask a Tenant Admin to grant access." />
    );
  }
  if (!can(permission)) {
    return <ErrorState message="You do not have permission to view this page." />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <CurrentUserProvider>
                  <AppLayout>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <RequirePermission permission="ViewDashboard">
                            <DashboardPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/fraud-signals"
                        element={
                          <RequirePermission permission="ViewSignals">
                            <FraudSignalsPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/hr-events"
                        element={
                          <RequirePermission permission="SubmitEvents">
                            <HrEventsPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/mno-events"
                        element={
                          <RequirePermission permission="SubmitEvents">
                            <MnoEventsPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/id-lookup"
                        element={
                          <RequirePermission permission="ViewSignals">
                            <IdLookupPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/activity-log"
                        element={
                          <RequirePermission permission="ViewAudit">
                            <ActivityLogPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <RequirePermission permission="ManageUsers">
                            <UsersPage />
                          </RequirePermission>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppLayout>
                </CurrentUserProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
