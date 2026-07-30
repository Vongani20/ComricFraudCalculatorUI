import { acquireAccessToken } from '@/auth/token';

const DEV_TENANT_KEY = 'comric.devTenantId';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await acquireAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const tenantId = localStorage.getItem(DEV_TENANT_KEY);
  if (tenantId) {
    // Business tenant for RLS / event isolation (Vodacom or MTN demo GUIDs)
    headers['X-Tenant-Id'] = tenantId;
    headers['X-Dev-TenantId'] = tenantId;
  }

  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(await getAuthHeaders()),
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    throw new Error('Sign-in failed or access was denied. Sign out and sign in with Microsoft again.');
  }

  if (response.status === 403) {
    const body = await response.text();
    let message = 'Your account does not have permission for this action. Ask an admin to grant API scope consent.';
    try {
      const json = JSON.parse(body) as { error?: string };
      if (json.error) {
        message = json.error;
      }
    } catch {
      if (body.trim()) {
        message = body;
      }
    }
    throw new Error(message);
  }

  if (!response.ok) {
    const body = await response.text();
    try {
      const json = JSON.parse(body) as { error?: string; detail?: string };
      if (json.error) {
        throw new Error(json.detail ? `${json.error} (${json.detail})` : json.error);
      }
    } catch (err) {
      if (err instanceof Error && err.message !== body && !err.message.startsWith('Unexpected')) {
        throw err;
      }
    }
    throw new Error(body || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getDashboardOverview: async () => {
    try {
      return await request<import('@/types/api').DashboardOverview>('/api/v1/dashboard/overview');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('404')) {
        throw error;
      }

      const [statsRaw, hrEvents, mnoEvents, signals] = await Promise.all([
        request<Record<string, number>>('/api/v1/dashboard/stats'),
        request<import('@/types/api').HrEvent[]>('/api/v1/hr-events?page=1&pageSize=10'),
        request<import('@/types/api').MnoEvent[]>('/api/v1/mno-events?page=1&pageSize=10'),
        request<import('@/types/api').FraudSignalList>('/api/v1/fraud-signals?page=1&pageSize=5'),
      ]);

      const totalHrEvents = statsRaw.totalHrEvents ?? 0;
      const totalMnoEvents = statsRaw.totalMnoEvents ?? 0;
      const highRiskAlerts =
        statsRaw.highRiskAlerts ??
        (statsRaw as { highRiskEvents?: number }).highRiskEvents ??
        0;

      const recentHr = hrEvents.map((event) => ({
        eventId: event.eventId,
        source: 'HR',
        idNumber: event.idNumber,
        eventType: event.eventType,
        riskScore: event.riskScore,
        status: event.verificationStatus,
        submittedAt: event.createdAt,
      }));

      const recentMno = mnoEvents.map((event) => ({
        eventId: event.eventId,
        source: 'MNO',
        idNumber: event.idNumber,
        eventType: event.eventType,
        riskScore: event.riskScore,
        status: event.riskScore > 70 ? 'High Risk' : 'Normal',
        submittedAt: event.createdAt,
      }));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const activitySeries = Array.from({ length: 30 }, (_, index) => {
        const day = new Date(thirtyDaysAgo);
        day.setDate(thirtyDaysAgo.getDate() + index);
        const key = day.toISOString().slice(0, 10);
        return {
          date: key,
          hrCount: hrEvents.filter((e) => e.createdAt.slice(0, 10) === key).length,
          mnoCount: mnoEvents.filter((e) => e.createdAt.slice(0, 10) === key).length,
        };
      });

      return {
        stats: {
          totalEventsSubmitted:
            statsRaw.totalEventsSubmitted ?? totalHrEvents + totalMnoEvents,
          activeSignals: statsRaw.activeSignals ?? signals.totalCount,
          highRiskAlerts,
          apiCallsToday: statsRaw.apiCallsToday ?? 0,
          totalHrEvents,
          totalMnoEvents,
        },
        activitySeries,
        recentSubmissions: [...recentHr, ...recentMno]
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
          .slice(0, 10),
        topFraudSignals: signals.signals,
      };
    }
  },

  listFraudSignals: (page = 1, pageSize = 20, activeOnly = true) =>
    request<import('@/types/api').FraudSignalList>(
      `/api/v1/fraud-signals?page=${page}&pageSize=${pageSize}&activeOnly=${activeOnly}`,
    ),

  getFraudSignal: (idHash: string) =>
    request<import('@/types/api').FraudSignal>(`/api/v1/fraud-signals/${idHash}`),

  getFraudSignalDetail: (signalId: string) =>
    request<import('@/types/api').FraudSignalDetail>(`/api/v1/fraud-signals/detail/${signalId}`),

  listHrEvents: (page = 1, pageSize = 20) =>
    request<import('@/types/api').HrEvent[]>(
      `/api/v1/hr-events?page=${page}&pageSize=${pageSize}`,
    ),

  submitHrEvent: (payload: import('@/types/api').SubmitHrEventRequest) =>
    request<import('@/types/api').HrEvent>('/api/v1/hr-events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listMnoEvents: (page = 1, pageSize = 20) =>
    request<import('@/types/api').MnoEvent[]>(
      `/api/v1/mno-events?page=${page}&pageSize=${pageSize}`,
    ),

  submitMnoEvent: (payload: import('@/types/api').SubmitMnoEventRequest) =>
    request<import('@/types/api').MnoEvent>('/api/v1/mno-events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listActivityLog: (page = 1, pageSize = 20) =>
    request<import('@/types/api').ActivityLogList>(
      `/api/v1/activity-log?page=${page}&pageSize=${pageSize}`,
    ),

  idCheck: (idNumber: string) =>
    request<import('@/types/api').IdCheckResult>('/api/v1/lookup/id-check', {
      method: 'POST',
      body: JSON.stringify({ idNumber }),
    }),
};

export const tenants = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Vodacom',
    code: 'VOD',
    theme: 'vodacom',
    user: {
      initials: 'DL',
      name: 'Davis Levin',
      role: 'Fraud Analyst',
      department: 'Risk & Compliance',
      employeeId: 'VOD-7842',
    },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'MTN',
    code: 'MTN',
    theme: 'mtn',
    user: {
      initials: 'NK',
      name: 'Nomsa Khumalo',
      role: 'SIM Fraud Investigator',
      region: 'Gauteng North',
      squad: 'SIM Integrity',
    },
  },
] as const;

export type TenantConfig = (typeof tenants)[number];

export function getSelectedTenantId(): string {
  return localStorage.getItem(DEV_TENANT_KEY) ?? tenants[0].id;
}

export function getSelectedTenant(): TenantConfig {
  const id = getSelectedTenantId();
  return tenants.find((t) => t.id === id) ?? tenants[0];
}

export function setSelectedTenantId(tenantId: string): void {
  localStorage.setItem(DEV_TENANT_KEY, tenantId);
}
