import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api/client';
import type { HrEvent, HrEventType, SubmitHrEventRequest, VerificationStatus } from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel, RiskBadge, StatusPill } from '@/components/ui';
import { formatLabel, truncateHash } from '@/utils/format';
import { validateSaIdNumber } from '@/utils/validateSaId';
const eventTypes: HrEventType[] = [
  'EmployeeVerification',
  'PayrollMismatch',
  'IdentityFraud',
];

const verificationStatuses: VerificationStatus[] = [
  'Confirmed',
  'Denied',
  'Inconclusive',
  'Pending',
];

const emptyForm: SubmitHrEventRequest = {
  idNumber: '',
  eventType: 'EmployeeVerification',
  eventDate: new Date().toISOString().slice(0, 16),
  employerName: '',
  employeeNumber: '',
  verificationStatus: 'Pending',
  notes: '',
};

export function HrEventsPage() {
  const [events, setEvents] = useState<HrEvent[]>([]);
  const [form, setForm] = useState<SubmitHrEventRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  const loadEvents = () => {
    setLoading(true);
    api
      .listHrEvents()
      .then(setEvents)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const idValidation = validateSaIdNumber(form.idNumber);
    if (!idValidation.valid) {
      setIdError(idValidation.message ?? 'Invalid ID number');
      setSubmitting(false);
      return;
    }
    setIdError(null);

    try {      await api.submitHrEvent({
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
        employeeNumber: form.employeeNumber || undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit HR event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Submit HR Event"
        description="Submit HR fraud intelligence for your tenant."
        breadcrumb="Submit HR Event"
      />

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>HR intelligence submission</h2>
        <p className="form-help">South African ID numbers are validated with Luhn checksum and date-of-birth checks before submission.</p>
        <div className="form-grid">
          <label>
            ID Number
            <input
              required
              maxLength={13}
              inputMode="numeric"
              pattern="\d{13}"
              placeholder="13-digit SA ID"
              value={form.idNumber}
              onChange={(e) => {
                setForm({ ...form, idNumber: e.target.value.replace(/\D/g, '').slice(0, 13) });
                setIdError(null);
              }}
              onBlur={() => {
                if (form.idNumber.length === 13) {
                  const result = validateSaIdNumber(form.idNumber);
                  setIdError(result.valid ? null : result.message ?? 'Invalid ID number');
                }
              }}
              aria-invalid={Boolean(idError)}
            />
            {idError ? <span className="field-error">{idError}</span> : null}
          </label>          <label>
            Event Type
            <select
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value as HrEventType })}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Event Date
            <input
              type="datetime-local"
              required
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </label>
          <label>
            Employer Name
            <input
              required
              maxLength={200}
              value={form.employerName}
              onChange={(e) => setForm({ ...form, employerName: e.target.value })}
            />
          </label>
          <label>
            Employee Number
            <input
              maxLength={50}
              value={form.employeeNumber}
              onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
            />
          </label>
          <label>
            Verification Status
            <select
              value={form.verificationStatus}
              onChange={(e) =>
                setForm({ ...form, verificationStatus: e.target.value as VerificationStatus })
              }
            >
              {verificationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="form-grid__full">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Event'}
        </button>
      </form>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading ? (
        <Panel title="Recent HR events" subtitle="Employment verification and anomaly records">
        <DataTable
          rows={events as unknown as Array<Record<string, unknown>>}
          columns={[
            {
              key: 'idNumber',
              label: 'ID Hash',
              render: (value) => <code>{truncateHash(String(value), 16)}</code>,
            },
            {
              key: 'eventType',
              label: 'Type',
              render: (value) => formatLabel(String(value)),
            },
            {
              key: 'verificationStatus',
              label: 'Verification',
              render: (value) => <StatusPill value={String(value)} />,
            },
            { key: 'employerName', label: 'Employer' },
            {
              key: 'riskScore',
              label: 'Risk',
              render: (value) => <RiskBadge score={Number(value)} />,
            },
            {
              key: 'eventDate',
              label: 'Event Date',
              render: (value) => <DateCell value={String(value)} />,
            },
          ]}
        />
        </Panel>
      ) : null}
    </section>
  );
}
