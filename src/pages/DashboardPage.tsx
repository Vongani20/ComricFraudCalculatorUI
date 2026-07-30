import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/api/client';
import type { DashboardOverview } from '@/types/api';
import {
  DataTable,
  DateCell,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  RiskBadge,
  StatCard,
  StatusPill,
} from '@/components/ui';
import { formatLabel, truncateHash } from '@/utils/format';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardOverview()
      .then(setOverview)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!overview) return [];
    return overview.activitySeries.map((point) => ({
      label: point.date.slice(5),
      hr: point.hrCount,
      mno: point.mnoCount,
    }));
  }, [overview]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!overview) return null;

  const { stats } = overview;
  const maxMetric = Math.max(
    stats.totalEventsSubmitted,
    stats.activeSignals,
    stats.highRiskAlerts,
    stats.apiCallsToday,
    1,
  );

  return (
    <section>
      <PageHeader
        title="Fraud Dashboard"
        description="Real-time overview of fraud intelligence activity for your tenant."
        breadcrumb="Overview"
      />

      <div className="stat-grid stat-grid--summary">
        <StatCard
          label="Total events submitted"
          value={stats.totalEventsSubmitted}
          hint={`HR ${stats.totalHrEvents} · MNO ${stats.totalMnoEvents}`}
          percent={(stats.totalEventsSubmitted / maxMetric) * 100}
          color="#4ec5a8"
        />
        <StatCard
          label="Active fraud signals"
          value={stats.activeSignals}
          percent={(stats.activeSignals / maxMetric) * 100}
          color="#f59e0b"
        />
        <StatCard
          label="High-risk alerts"
          value={stats.highRiskAlerts}
          hint="Score > 70"
          percent={(stats.highRiskAlerts / maxMetric) * 100}
          color="#ef4444"
        />
        <StatCard
          label="API calls today"
          value={stats.apiCallsToday}
          percent={(stats.apiCallsToday / maxMetric) * 100}
          color="#60a5fa"
        />
      </div>

      <div className="dashboard-grid">
        <Panel title="Activity chart" subtitle="Event submission volume over the last 30 days (HR vs MNO)">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ec5a8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4ec5a8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="mnoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="hr" name="HR" stroke="#4ec5a8" fill="url(#hrFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="mno" name="MNO" stroke="#60a5fa" fill="url(#mnoFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top fraud signals" subtitle="Highest-risk anonymous signals currently active">
          <DataTable
            emptyMessage="No active fraud signals."
            rows={overview.topFraudSignals as unknown as Array<Record<string, unknown>>}
            columns={[
              {
                key: 'idNumberHash',
                label: 'ID Hash',
                render: (value) => <code>{truncateHash(String(value), 14)}</code>,
              },
              {
                key: 'signalCategory',
                label: 'Category',
                render: (value) => formatLabel(String(value)),
              },
              {
                key: 'aggregateRiskScore',
                label: 'Risk',
                render: (value) => <RiskBadge score={Number(value)} />,
              },
              { key: 'occurrenceCount', label: 'Count' },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Recent submissions" subtitle="Latest HR and MNO event submissions for this tenant">
        <DataTable
          emptyMessage="No submissions yet."
          rows={overview.recentSubmissions as unknown as Array<Record<string, unknown>>}
          columns={[
            { key: 'source', label: 'Source' },
            {
              key: 'idNumber',
              label: 'ID Hash',
              render: (value) => <code>{truncateHash(String(value), 16)}</code>,
            },
            {
              key: 'eventType',
              label: 'Event type',
              render: (value) => formatLabel(String(value)),
            },
            {
              key: 'riskScore',
              label: 'Risk',
              render: (value) => <RiskBadge score={Number(value)} />,
            },
            {
              key: 'status',
              label: 'Status',
              render: (value) => <StatusPill value={String(value)} />,
            },
            {
              key: 'submittedAt',
              label: 'Submitted',
              render: (value) => <DateCell value={String(value)} />,
            },
          ]}
        />
      </Panel>
    </section>
  );
}
