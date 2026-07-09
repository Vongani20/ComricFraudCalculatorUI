import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { ActivityLogEntry } from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel } from '@/components/ui';

export function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listActivityLog()
      .then((result) => setEntries(result.entries))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <section>
      <PageHeader
        title="Activity Log"
        description="Audit trail of API requests for compliance and monitoring."
        breadcrumb="Activity Log"
      />

      <Panel title="Audit trail" subtitle="Recent API activity for this tenant">
        <DataTable
          rows={entries as unknown as Array<Record<string, unknown>>}
          columns={[
            { key: 'action', label: 'Action' },
            { key: 'httpMethod', label: 'Method' },
            { key: 'endpoint', label: 'Endpoint' },
            { key: 'statusCode', label: 'Status' },
            { key: 'clientIp', label: 'Client IP' },
            {
              key: 'createdAt',
              label: 'Timestamp',
              render: (value) => <DateCell value={String(value)} />,
            },
          ]}
        />
      </Panel>
    </section>
  );
}
