import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Stats } from '../lib/types';

const PAGES = [
  { to: '/', label: 'Dashboard', title: 'Dashboard', sub: "Here's what's happening on ClearStock today" },
  { to: '/verifications', label: 'Verifications', title: 'Verifications', sub: 'Review and approve seller applications' },
  { to: '/users', label: 'Users', title: 'Users', sub: 'Manage buyer and seller accounts' },
  { to: '/listings', label: 'Listings', title: 'Listings', sub: 'Moderate products on the marketplace' },
  { to: '/payments', label: 'Payments', title: 'Payments', sub: 'Escrow, commission and what sellers are owed' },
  { to: '/reviews', label: 'Reviews', title: 'Reviews', sub: 'Ratings buyers and sellers left each other' },
  { to: '/reports', label: 'Reports', title: 'Reports', sub: 'Handle complaints about sellers, buyers, listings and reviews' },
  { to: '/admins', label: 'Admins', title: 'Admins', sub: 'Manage admin accounts' },
  { to: '/audit-logs', label: 'Audit logs', title: 'Audit logs', sub: 'A record of every admin action' },
  { to: '/settings', label: 'Settings', title: 'Settings', sub: 'Manage your account' },
];

const DETAIL_PAGES = [
  {
    match: /^\/verifications\/\d+/,
    title: 'Verification details',
    sub: "Review this seller's application",
  },
  {
    match: /^\/listings\/\d+/,
    title: 'Listing details',
    sub: 'Review and moderate this product',
  },
  {
    match: /^\/reports\/\d+/,
    title: 'Report details',
    sub: 'Review this complaint and take action',
  },
];

export default function Layout() {
  const { admin, signOut } = useAuth();
  const location = useLocation();
  const [pending, setPending] = useState<number | null>(null);

  // The pending badge should reflect reality after an approval, so it is
  // refetched whenever the route changes rather than loaded once.
  useEffect(() => {
    api
      .get<Stats>('/admin/stats')
      .then((stats) => setPending(stats.pendingVerifications))
      .catch(() => setPending(null));
  }, [location.pathname]);

  // A detail route gets its own heading rather than inheriting the list's,
  // which otherwise reads "Reports · Handle complaints…" while you are looking
  // at one specific complaint.
  const detail = DETAIL_PAGES.find((d) => d.match.test(location.pathname));

  const page =
    detail ??
    PAGES.find((p) => p.to !== '/' && location.pathname.startsWith(p.to)) ??
    PAGES[0];

  const isSuper = admin?.role === 'SUPER_ADMIN';
  const visible = PAGES.filter((p) => p.to !== '/admins' || isSuper);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo-mark.png" alt="" />
          <div>
            <div className="brand-name">
              ClearStock
              <br />
              Ghana
            </div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="nav">
          {visible.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <span>{item.label}</span>
              {item.to === '/verifications' && !!pending && (
                <span className="nav-count">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="avatar">{admin?.name?.charAt(0).toUpperCase() ?? '?'}</div>
          <div className="grow">
            <div>{admin?.name}</div>
            <small>{isSuper ? 'Super admin' : 'Admin'}</small>
          </div>
          <button className="btn-sm btn-outline" onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{page.title}</h1>
            <p>{page.sub}</p>
          </div>
          <span className="role-pill">{isSuper ? 'Super admin' : 'Admin'}</span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
