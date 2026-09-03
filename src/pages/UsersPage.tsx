import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api/client';
import type { TenantUser, TenantUserRole } from '@/types/api';
import { DataTable, DateCell, ErrorState, LoadingState, PageHeader, Panel } from '@/components/ui';
import { useCurrentUser } from '@/auth/CurrentUserProvider';
import { formatEmailLocalPart } from '@/utils/format';

const roles: TenantUserRole[] = ['TenantAdmin', 'Analyst', 'Viewer'];

const roleHelp: Record<TenantUserRole, string> = {
  TenantAdmin: 'Full access: submit events, dashboard, manage users, audit log',
  Analyst: 'Submit events, view dashboard, view fraud signals',
  Viewer: 'View dashboard and fraud signals (read-only)',
};

export function UsersPage() {
  const { can, refresh: refreshMe } = useCurrentUser();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<TenantUserRole>('Analyst');
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    api
      .listUsers()
      .then((result) => setUsers(result.users))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!can('ManageUsers')) {
      setError('Only Tenant Admins can manage users.');
      setLoading(false);
      return;
    }
    loadUsers();
  }, [can]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormMessage(null);
    setError(null);

    try {
      await api.upsertUser({
        email: email.trim(),
        displayName: displayName.trim() || undefined,
        role,
      });
      setEmail('');
      setDisplayName('');
      setRole('Analyst');
      setFormMessage('User role saved.');
      loadUsers();
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (user: TenantUser, nextRole: TenantUserRole) => {
    setError(null);
    try {
      await api.updateUser(user.tenantUserId, {
        role: nextRole,
        displayName: user.displayName ?? undefined,
        isActive: user.isActive,
      });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeactivate = async (user: TenantUser) => {
    const label = user.displayName || formatEmailLocalPart(user.email) || 'this user';
    if (!window.confirm(`Deactivate access for ${label}?`)) return;
    setError(null);
    try {
      await api.deactivateUser(user.tenantUserId);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  if (loading) return <LoadingState />;
  if (error && users.length === 0) return <ErrorState message={error} />;

  return (
    <section>
      <PageHeader
        title="User roles"
        description="Assign Tenant Admin, Analyst, or Viewer roles for this tenant (§5.1)."
        breadcrumb="Users"
      />

      {error ? <p className="form-error">{error}</p> : null}
      {formMessage ? <p className="form-success">{formMessage}</p> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Add or update user</h2>
        <p className="form-help">
          Enter a work email and choose a role. Existing users are updated in place.
        </p>
        <div className="form-grid">
          <label>
            Email
            <input
              required
              type="email"
              placeholder="email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Display name
            <input
              placeholder="Optional"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as TenantUserRole)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === 'TenantAdmin' ? 'Tenant Admin' : r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="form-help">{roleHelp[role]}</p>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save user role'}
        </button>
      </form>

      <Panel title="Tenant users" subtitle="Active and inactive memberships for the selected tenant">
        <DataTable
          rows={users as unknown as Array<Record<string, unknown>>}
          columns={[
            {
              key: 'displayName',
              label: 'Name',
              render: (_value, row) => {
                const user = row as unknown as TenantUser;
                return user.displayName || formatEmailLocalPart(user.email) || '—';
              },
            },
            {
              key: 'role',
              label: 'Role',
              render: (_value, row) => {
                const user = row as unknown as TenantUser;
                const label = user.displayName || formatEmailLocalPart(user.email) || 'user';
                return (
                  <select
                    className="inline-select"
                    value={user.role}
                    disabled={!user.isActive}
                    onChange={(e) => void handleRoleChange(user, e.target.value as TenantUserRole)}
                    aria-label={`Role for ${label}`}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r === 'TenantAdmin' ? 'Tenant Admin' : r}
                      </option>
                    ))}
                  </select>
                );
              },
            },
            {
              key: 'isActive',
              label: 'Status',
              render: (value) => (value ? 'Active' : 'Inactive'),
            },
            {
              key: 'createdAt',
              label: 'Added',
              render: (value) => <DateCell value={String(value)} />,
            },
            {
              key: 'tenantUserId',
              label: 'Actions',
              render: (_value, row) => {
                const user = row as unknown as TenantUser;
                if (!user.isActive) return '—';
                return (
                  <button
                    type="button"
                    className="btn-secondary btn-secondary--compact"
                    onClick={() => void handleDeactivate(user)}
                  >
                    Deactivate
                  </button>
                );
              },
            },
          ]}
        />
      </Panel>
    </section>
  );
}
