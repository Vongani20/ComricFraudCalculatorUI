import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { IdCheckResult } from '@/types/api';
import { DataTable, ErrorState, PageHeader, Panel, RiskBadge } from '@/components/ui';
import { formatLabel, truncateHash } from '@/utils/format';
import { validateSaIdNumber } from '@/utils/validateSaId';

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
  const [idError, setIdError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (!idFromUrl) return;

    setIdNumber(idFromUrl.replace(/\D/g, '').slice(0, 13));
    const idValidation = validateSaIdNumber(idFromUrl);
    if (!idValidation.valid) {
      setIdError(idValidation.message ?? 'ID number must be exactly 13 digits.');
      return;
    }
    setIdError(null);
    void runIdCheck(idFromUrl.replace(/\D/g, '').slice(0, 13), { setResult, setError, setLoading });
  }, [searchParams]);

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    const idValidation = validateSaIdNumber(idNumber);
    if (!idValidation.valid) {
      setIdError(idValidation.message ?? 'ID number must be exactly 13 digits.');
      return;
    }
    setIdError(null);
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
              maxLength={13}
              inputMode="numeric"
              pattern="\d{13}"
              placeholder="13-digit SA ID"
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13));
                setIdError(null);
              }}
              onBlur={() => {
                if (idNumber.length === 13) {
                  const result = validateSaIdNumber(idNumber);
                  setIdError(result.valid ? null : result.message ?? 'Invalid ID number');
                } else if (idNumber.length > 0) {
                  setIdError('ID number must be exactly 13 digits.');
                }
              }}
              aria-invalid={Boolean(idError)}
            />
            {idError ? <span className="field-error">{idError}</span> : null}
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
