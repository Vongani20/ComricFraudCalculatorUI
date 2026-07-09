import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { FraudSignal } from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel, RiskBadge } from '@/components/ui';
import { formatLabel, truncateHash } from '@/utils/format';

export function FraudSignalsPage() {
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listFraudSignals()
      .then((result) => setSignals(result.signals))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <section>
      <PageHeader
        title="Fraud Signals"
        description="Aggregated cross-channel alerts keyed by hashed ID number."
        breadcrumb="Fraud Signals"
      />

      <Panel title="Active signals" subtitle="Cross-tenant fraud alerts aggregated by hashed ID">
        <DataTable
          emptyMessage="No active fraud signals for this tenant."
          rows={signals as unknown as Array<Record<string, unknown>>}
          columns={[
          {
            key: 'idNumberHash',
            label: 'ID Hash',
            render: (value) => <code>{truncateHash(String(value), 16)}</code>,
          },
          {
            key: 'signalType',
            label: 'Type',
            render: (value) => formatLabel(String(value)),
          },
          {
            key: 'signalCategory',
            label: 'Category',
            render: (value) => formatLabel(String(value)),
          },
          { key: 'occurrenceCount', label: 'Count' },
          {
            key: 'aggregateRiskScore',
            label: 'Risk',
            render: (value) => <RiskBadge score={Number(value)} />,
          },
          {
            key: 'lastSeen',
            label: 'Last Seen',
            render: (value) => <DateCell value={String(value)} />,
          },
          {
            key: 'isActive',
            label: 'Status',
            render: (value) => (value ? 'Active' : 'Inactive'),
          },
          ]}
        />
      </Panel>
    </section>
  );
}
