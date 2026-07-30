import type { ReactNode } from 'react';
import { formatDate, formatLabel, riskLevel } from '@/utils/format';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  percent?: number;
  color?: string;
}

function DonutRing({ percent, color = '#4ec5a8' }: { percent: number; color?: string }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="donut-ring" aria-hidden>
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={radius} fill="none" stroke="#edf1f5" strokeWidth="6" />
        <circle
          cx="27"
          cy="27"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="donut-ring__center">{Math.round(percent)}%</span>
    </div>
  );
}

export function StatCard({ label, value, hint, percent = 0, color }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {hint ? <p className="stat-card__hint">{hint}</p> : null}
      </div>
      <DonutRing percent={percent} color={color} />
    </article>
  );
}

interface RiskBadgeProps {
  score: number;
}

export function RiskBadge({ score }: RiskBadgeProps) {
  const level = riskLevel(score);
  return <span className={`risk-badge risk-badge--${level}`}>{score}</span>;
}

interface DataTableProps {
  columns: Array<{
    key: string;
    label: string;
    render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  }>;
  rows: Array<Record<string, unknown>>;
  emptyMessage?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedRowKey?: string | null;
}

export function DataTable({
  columns,
  rows,
  emptyMessage = 'No records found.',
  onRowClick,
  selectedRowKey,
}: DataTableProps) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowKey = String(row.id ?? row.eventId ?? row.signalId ?? row.activityLogId ?? index);
            const selected = selectedRowKey != null && selectedRowKey === rowKey;
            return (
              <tr
                key={rowKey}
                className={[
                  onRowClick ? 'data-table__row--clickable' : '',
                  selected ? 'data-table__row--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  breadcrumb?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, breadcrumb, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {breadcrumb ? (
          <div className="breadcrumb">
            Dashboard / <strong>{breadcrumb}</strong>
          </div>
        ) : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, subtitle, action, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface StatusPillProps {
  value: string;
}

export function StatusPill({ value }: StatusPillProps) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes('denied') || normalized.includes('fraud') || normalized.includes('swap')
      ? 'danger'
      : normalized.includes('pending') || normalized.includes('inconclusive')
        ? 'warning'
        : normalized.includes('confirmed') || normalized.includes('active')
          ? 'success'
          : 'neutral';

  return <span className={`status-pill status-pill--${tone}`}>{formatLabel(value)}</span>;
}

export function LoadingState() {
  return <p className="loading-state">Loading…</p>;
}

export function ErrorState({ message }: { message: string }) {
  return <p className="error-state">{message}</p>;
}

export function DateCell({ value }: { value: string }) {
  return <span>{formatDate(value)}</span>;
}
