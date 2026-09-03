import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { FraudSignal, FraudSignalDetail } from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel, RiskBadge } from '@/components/ui';
import { formatDate, formatLabel, riskLevel, truncateHash } from '@/utils/format';

type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

export function FraudSignalsPage() {
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FraudSignalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  useEffect(() => {
    api
      .listFraudSignals(1, 100)
      .then((result) => setSignals(result.signals))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const lastSeenDay = toDateKey(signal.lastSeen);
      if (dateFrom && lastSeenDay < dateFrom) return false;
      if (dateTo && lastSeenDay > dateTo) return false;
      if (riskFilter !== 'all' && riskLevel(signal.aggregateRiskScore) !== riskFilter) return false;
      return true;
    });
  }, [signals, dateFrom, dateTo, riskFilter]);

  const filtersActive = Boolean(dateFrom || dateTo || riskFilter !== 'all');

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setRiskFilter('all');
  };

  const openDetail = async (signalId: string) => {
    setSelectedId(signalId);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const result = await api.getFraudSignalDetail(signalId);
      setDetail(result);
    } catch (err) {
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : 'Failed to load signal detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const maxCategoryCount = Math.max(
    1,
    ...(detail?.categoryBreakdown.map((c) => c.occurrenceCount) ?? [1]),
  );
  const maxTrend = Math.max(
    1,
    ...(detail?.aggregateRiskTrend.map((p) => p.aggregateRiskScore) ?? [1]),
  );

  return (
    <section>
      <PageHeader
        title="Fraud Signals"
        description="Anonymous cross-tenant fraud feed aggregated from all platform contributions."
        breadcrumb="Fraud Signals"
      />

      <div className={`signal-layout${selectedId ? ' signal-layout--open' : ''}`}>
        <Panel
          title="Active signals"
          subtitle="Click a row for occurrence timeline, category breakdown, and risk trend"
        >
          <div className="table-filters" role="search" aria-label="Filter signals by date and risk">
            <label>
              From
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            <label>
              Risk
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
              >
                <option value="all">All levels</option>
                <option value="critical">Critical (80+)</option>
                <option value="high">High (60–79)</option>
                <option value="medium">Medium (40–59)</option>
                <option value="low">Low (0–39)</option>
              </select>
            </label>
            <div className="table-filters__actions">
              <span className="table-filters__count">
                {filteredSignals.length} of {signals.length}
              </span>
              {filtersActive ? (
                <button type="button" className="btn-secondary btn-secondary--compact" onClick={clearFilters}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <DataTable
            emptyMessage={
              filtersActive ? 'No signals match the selected date and risk filters.' : 'No active fraud signals yet.'
            }
            selectedRowKey={selectedId}
            onRowClick={(row) => {
              const id = String(row.signalId ?? '');
              if (id) void openDetail(id);
            }}
            rows={filteredSignals as unknown as Array<Record<string, unknown>>}
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

        {selectedId ? (
          <aside className="signal-detail" aria-label="Signal detail">
            <div className="signal-detail__header">
              <div>
                <h2>Signal detail</h2>
                <p>Anonymous feed drill-down (§5.2.5)</p>
              </div>
              <button type="button" className="btn-secondary" onClick={closeDetail}>
                Close
              </button>
            </div>

            {detailLoading ? <LoadingState /> : null}
            {detailError ? <ErrorState message={detailError} /> : null}

            {detail && !detailLoading ? (
              <>
                <div className="signal-detail__meta">
                  <div>
                    <span className="signal-detail__label">ID hash</span>
                    <code>{truncateHash(detail.signal.idNumberHash, 20)}</code>
                  </div>
                  <div>
                    <span className="signal-detail__label">Type</span>
                    <strong>{formatLabel(detail.signal.signalType)}</strong>
                  </div>
                  <div>
                    <span className="signal-detail__label">Category</span>
                    <strong>{formatLabel(detail.signal.signalCategory)}</strong>
                  </div>
                  <div>
                    <span className="signal-detail__label">Risk</span>
                    <RiskBadge score={detail.signal.aggregateRiskScore} />
                  </div>
                  <div>
                    <span className="signal-detail__label">Occurrences</span>
                    <strong>{detail.signal.occurrenceCount}</strong>
                  </div>
                  <div>
                    <span className="signal-detail__label">Window</span>
                    <strong>
                      {formatDate(detail.signal.firstSeen)} → {formatDate(detail.signal.lastSeen)}
                    </strong>
                  </div>
                </div>

                <section className="signal-detail__section">
                  <h3>Category breakdown</h3>
                  <p className="signal-detail__hint">
                    All signal categories for this hashed ID across the platform.
                  </p>
                  <ul className="signal-bars">
                    {detail.categoryBreakdown.map((item) => (
                      <li key={item.signalCategory}>
                        <div className="signal-bars__label">
                          <span>{formatLabel(item.signalCategory)}</span>
                          <span>
                            {item.occurrenceCount} evt · max <RiskBadge score={item.maxRiskScore} />
                          </span>
                        </div>
                        <div className="signal-bars__track">
                          <div
                            className="signal-bars__fill"
                            style={{
                              width: `${(item.occurrenceCount / maxCategoryCount) * 100}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="signal-detail__section">
                  <h3>Occurrence timeline</h3>
                  <ol className="signal-timeline">
                    {detail.occurrenceTimeline.map((point) => (
                      <li key={`${point.occurrenceIndex}-${point.occurredAt}`}>
                        <div className="signal-timeline__dot" />
                        <div>
                          <strong>{point.label}</strong>
                          <span>{formatDate(point.occurredAt)}</span>
                          <span>Est. risk {point.estimatedRiskScore}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="signal-detail__section">
                  <h3>Aggregate risk trend</h3>
                  <div className="signal-trend" role="img" aria-label="Risk trend chart">
                    {detail.aggregateRiskTrend.map((point, index) => (
                      <div key={`${point.at}-${index}`} className="signal-trend__col">
                        <div
                          className="signal-trend__bar"
                          style={{ height: `${(point.aggregateRiskScore / maxTrend) * 100}%` }}
                          title={`${formatDate(point.at)}: ${point.aggregateRiskScore}`}
                        />
                        <span>{point.aggregateRiskScore}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
