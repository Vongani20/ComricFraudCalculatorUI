import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { IdCheckResult } from '@/types/api';
import { DataTable, ErrorState, PageHeader, Panel, RiskBadge } from '@/components/ui';
import { formatLabel, truncateHash } from '@/utils/format';

async function runIdCheck(
  idNumber: string,
  setters: {
    setResult: (value: IdCheckResult | null) => void;
    setError: (value: string | null) => void;
    setLoading: (value: boolean) => void;
  },
) {
  setters.setLoading(true);
  setters.setError(null);
  setters.setResult(null);

  try {
    const response = await api.idCheck(idNumber);
    setters.setResult(response);
  } catch (err) {
    setters.setError(err instanceof Error ? err.message : 'ID check failed');
  } finally {
    setters.setLoading(false);
  }
}

export function IdLookupPage() {
  const [searchParams] = useSearchParams();
  const [idNumber, setIdNumber] = useState(searchParams.get('id') ?? '');
  const [result, setResult] = useState<IdCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (!idFromUrl) return;

    setIdNumber(idFromUrl);
    void runIdCheck(idFromUrl, { setResult, setError, setLoading });
  }, [searchParams]);

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    await runIdCheck(idNumber, { setResult, setError, setLoading });
  };

  return (
    <section>
      <PageHeader
        title="ID Lookup"
        description="Real-time fraud signal check by South African ID number."
        breadcrumb="ID Lookup"
      />

      <Panel title="Check identity" subtitle="Search hashed fraud signals for a South African ID number">
        <form className="lookup-form" onSubmit={handleCheck}>
          <label>
            ID Number
            <input
              required
              maxLength={20}
              placeholder="e.g. 8501015800084"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Checking…' : 'Check ID'}
          </button>
        </form>
      </Panel>

      {error ? <ErrorState message={error} /> : null}

      {result ? (
        <div className="lookup-result">
          <div className={`lookup-banner lookup-banner--${result.matchFound ? 'hit' : 'clear'}`}>
            <strong>{result.matchFound ? 'Match found' : 'No match'}</strong>
            <span>Hash: {truncateHash(result.idNumberHash, 20)}</span>
          </div>

          {result.matchingSignals.length > 0 ? (
            <Panel title="Matching signals" subtitle={`${result.matchingSignals.length} signal(s) found`}>
              <DataTable
                rows={result.matchingSignals as unknown as Array<Record<string, unknown>>}
                columns={[
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
                  {
                    key: 'aggregateRiskScore',
                    label: 'Risk',
                    render: (value) => <RiskBadge score={Number(value)} />,
                  },
                  { key: 'occurrenceCount', label: 'Occurrences' },
                ]}
              />
            </Panel>
          ) : (
            <p className="empty-state">No matching fraud signals for this ID.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
