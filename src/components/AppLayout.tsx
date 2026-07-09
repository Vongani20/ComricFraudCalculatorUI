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
  UserSearch,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { getSelectedTenant, getSelectedTenantId, setSelectedTenantId, tenants } from '@/api/client';
import { resolveSearchQuery } from '@/utils/search';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fraud-signals', label: 'Fraud Signals', icon: Radio },
  { to: '/hr-events', label: 'Submit HR Event', icon: Users },
  { to: '/mno-events', label: 'MNO Events', icon: Smartphone },
  { to: '/id-lookup', label: 'ID Lookup', icon: UserSearch },
  { to: '/activity-log', label: 'Activity Log', icon: Activity },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tenantId, setTenantId] = useState(getSelectedTenantId());
  const [search, setSearch] = useState('');
  const tenant = getSelectedTenant();

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
          {navItems.map((item) => {
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
          <p>Switch between MNO tenants to view isolated fraud signals and events.</p>
          <select value={tenantId} onChange={(e) => handleTenantChange(e.target.value)}>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
          <div className="tenant-user-card">
            <div className={`tenant-user-card__avatar tenant-user-card__avatar--${tenant.theme}`}>
              {tenant.user.initials}
            </div>
            <div>
              <strong>{tenant.user.name}</strong>
              <span>{tenant.user.role}</span>
              {'department' in tenant.user ? (
                <ul className="tenant-user-card__meta">
                  <li>Dept: {tenant.user.department}</li>
                  <li>ID: {tenant.user.employeeId}</li>
                </ul>
              ) : (
                <ul className="tenant-user-card__meta">
                  <li>Region: {tenant.user.region}</li>
                  <li>Squad: {tenant.user.squad}</li>
                </ul>
              )}
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
              <div className={`user-chip__avatar user-chip__avatar--${tenant.theme}`}>
                {tenant.user.initials}
              </div>
              <div className="user-chip__meta">
                <span className="user-chip__name">{tenant.user.name}</span>
                <span className="user-chip__role">{tenant.user.role}</span>
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
