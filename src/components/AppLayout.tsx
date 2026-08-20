import { NavLink, useNavigate } from 'react-router-dom';
import { useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Radio,
  Search,
  Settings,
  Shield,
  Smartphone,
  UserCog,
  UserSearch,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useCurrentUser } from '@/auth/CurrentUserProvider';
import { getSelectedTenant, getSelectedTenantId, setSelectedTenantId, tenants } from '@/api/client';
import { resolveSearchQuery } from '@/utils/search';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: 'ViewDashboard' },
  { to: '/fraud-signals', label: 'Fraud Signals', icon: Radio, permission: 'ViewSignals' },
  { to: '/hr-events', label: 'Submit HR Event', icon: Users, permission: 'SubmitEvents' },
  { to: '/mno-events', label: 'MNO Events', icon: Smartphone, permission: 'SubmitEvents' },
  { to: '/id-lookup', label: 'ID Lookup', icon: UserSearch, permission: 'ViewSignals' },
  { to: '/activity-log', label: 'Activity Log', icon: Activity, permission: 'ViewAudit' },
  { to: '/users', label: 'Users', icon: UserCog, permission: 'ManageUsers' },
];

interface AppLayoutProps {
  children: ReactNode;
}

function initialsFrom(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return '??';
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { logout, accountName } = useAuth();
  const { currentUser, can } = useCurrentUser();
  const [tenantId, setTenantId] = useState(getSelectedTenantId());
  const [search, setSearch] = useState('');
  const tenant = getSelectedTenant();

  const displayName =
    currentUser?.displayName || accountName || currentUser?.email || tenant.user.name;
  const displayRole = currentUser?.roleDisplayName || tenant.user.role;
  const avatar = initialsFrom(displayName);

  const handleTenantChange = (value: string) => {
    setSelectedTenantId(value);
    setTenantId(value);
    window.location.reload();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { path, idNumber } = resolveSearchQuery(search);
    if (idNumber) {
      navigate(`${path}?id=${encodeURIComponent(idNumber)}`);
      return;
    }
    navigate(path);
  };

  const visibleNav = navItems.filter((item) => can(item.permission));

  return (
    <div className={`app-shell app-shell--${tenant.theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__icon">
            <Shield size={20} />
          </div>
          <div>
            <strong>Comric</strong>
            <span>Fraud Calculator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="promo-card">
          <h3>Tenant workspace</h3>
          <p>Switch between NO tenants to view isolated fraud signals and events.</p>
          <select value={tenantId} onChange={(e) => handleTenantChange(e.target.value)}>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
          <div className="tenant-user-card">
            <div className={`tenant-user-card__avatar tenant-user-card__avatar--${tenant.theme}`}>
              {avatar}
            </div>
            <div>
              <strong title={displayName}>{displayName}</strong>
              <span title={displayRole}>{displayRole}</span>
              {currentUser?.email ? (
                <ul className="tenant-user-card__meta">
                  <li title={currentUser.email}>{currentUser.email}</li>
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="top-header">
          <div className="top-header__spacer" />
          <form className="search-bar" onSubmit={handleSearch} role="search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search anything"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search anything"
            />
          </form>

          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="Calendar">
              <CalendarDays size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Settings">
              <Settings size={18} />
            </button>
            <div className="user-chip">
              <div className={`user-chip__avatar user-chip__avatar--${tenant.theme}`}>{avatar}</div>
              <div className="user-chip__meta">
                <span className="user-chip__name">{displayName}</span>
                <span className="user-chip__role">{displayRole}</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Sign out"
              onClick={() => {
                void logout().then(() => navigate('/login', { replace: true }));
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
