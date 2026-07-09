import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { AppLayout } from '@/components/AppLayout';
import { ActivityLogPage } from '@/pages/ActivityLogPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FraudSignalsPage } from '@/pages/FraudSignalsPage';
import { HrEventsPage } from '@/pages/HrEventsPage';
import { IdLookupPage } from '@/pages/IdLookupPage';
import { LoginPage, RequireAuth } from '@/pages/LoginPage';
import { MnoEventsPage } from '@/pages/MnoEventsPage';

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
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/fraud-signals" element={<FraudSignalsPage />} />
                    <Route path="/hr-events" element={<HrEventsPage />} />
                    <Route path="/mno-events" element={<MnoEventsPage />} />
                    <Route path="/id-lookup" element={<IdLookupPage />} />
                    <Route path="/activity-log" element={<ActivityLogPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
