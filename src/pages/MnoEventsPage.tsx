import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api/client';
import type {
  ApplicationChannel,
  MnoEvent,
  MnoEventType,
  SubmitMnoEventRequest,
} from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel, RiskBadge } from '@/components/ui';
import { formatLabel } from '@/utils/format';

const eventTypes: MnoEventType[] = [
  'NewSIMApplication',
  'ContractApplication',
  'RICARegistration',
  'PortRequest',
  'SIMSwap',
];

const channels: ApplicationChannel[] = [
  'InStore',
  'Online',
  'USSD',
  'CallCentre',
  'ThirdParty',
];

const emptyForm: SubmitMnoEventRequest = {
  idNumber: '',
  msisdn: '',
  eventType: 'NewSIMApplication',
  eventDate: new Date().toISOString().slice(0, 16),
  applicationChannel: 'InStore',
  outletOrDealer: '',
  deviceImei: '',
  flagReason: '',
};

export function MnoEventsPage() {
  const [events, setEvents] = useState<MnoEvent[]>([]);
  const [form, setForm] = useState<SubmitMnoEventRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = () => {
    setLoading(true);
    api
      .listMnoEvents()
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

    try {
      await api.submitMnoEvent({
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
        deviceImei: form.deviceImei || undefined,
        flagReason: form.flagReason || undefined,
      });
      setForm(emptyForm);
      loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit MNO event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="MNO Events"
        description="Telecom channel events including SIM applications, port requests, and swaps."
        breadcrumb="MNO Events"
      />

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Submit MNO Event</h2>
        <div className="form-grid">
          <label>
            ID Number
            <input
              required
              maxLength={20}
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </label>
          <label>
            MSISDN
            <input
              required
              maxLength={20}
              value={form.msisdn}
              onChange={(e) => setForm({ ...form, msisdn: e.target.value })}
            />
          </label>
          <label>
            Event Type
            <select
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value as MnoEventType })}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Channel
            <select
              value={form.applicationChannel}
              onChange={(e) =>
                setForm({ ...form, applicationChannel: e.target.value as ApplicationChannel })
              }
            >
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {formatLabel(channel)}
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
            Outlet / Dealer
            <input
              required
              maxLength={200}
              value={form.outletOrDealer}
              onChange={(e) => setForm({ ...form, outletOrDealer: e.target.value })}
            />
          </label>
          <label>
            Device IMEI
            <input
              maxLength={20}
              value={form.deviceImei}
              onChange={(e) => setForm({ ...form, deviceImei: e.target.value })}
            />
          </label>
          <label className="form-grid__full">
            Flag Reason
            <textarea
              rows={2}
              value={form.flagReason}
              onChange={(e) => setForm({ ...form, flagReason: e.target.value })}
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
        <Panel title="Recent MNO events" subtitle="SIM, port, and RICA channel activity">
          <DataTable
          rows={events as unknown as Array<Record<string, unknown>>}
          columns={[
            { key: 'idNumber', label: 'ID Number' },
            { key: 'msisdn', label: 'MSISDN' },
            {
              key: 'eventType',
              label: 'Type',
              render: (value) => formatLabel(String(value)),
            },
            {
              key: 'applicationChannel',
              label: 'Channel',
              render: (value) => formatLabel(String(value)),
            },
            { key: 'outletOrDealer', label: 'Outlet' },
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
