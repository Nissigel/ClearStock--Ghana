import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { AuditLog, Stats, Verification } from '../lib/types';
import {
  Badge,
  ErrorNote,
  Loading,
  relativeTime,
  useLoad,
} from '../components/common';

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const { data, error, loading } = useLoad(async () => {
    const [stats, pending, logs] = await Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<Verification[]>('/admin/verifications?status=PENDING'),
      api.get<AuditLog[]>('/admin/audit-logs'),
    ]);
    return { stats, pending, logs };
  });

  if (loading) return <Loading what="the dashboard" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  const { stats, pending, logs } = data;

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Welcome back, {admin?.name}</h2>

      <div className="stat-grid">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Active listings" value={stats.activeListings} />
        <Stat label="Completed transactions" value={stats.completedTransactions} />
        <Stat label="Verified sellers" value={stats.verifiedSellers} />
        <Stat label="Pending verifications" value={stats.pendingVerifications} tone="warn" />
        <Stat label="Open reports" value={stats.openReports} tone="bad" />
      </div>

      <div className="two-col">
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head">
              <span>Pending verifications</span>
              <a href="/verifications" onClick={go(navigate, '/verifications')}>
                View all
              </a>
            </div>
            {pending.length === 0 ? (
              <div className="panel-row muted">Nothing waiting for review.</div>
            ) : (
              pending.slice(0, 5).map((item) => (
                <div className="panel-row" key={item.sellerProfileId}>
                  <div className="grow">
                    <div className="strong">{item.sellerName}</div>
                    <div className="muted">
                      {item.businessName ?? sellerTypeLabel(item.sellerType)}
                    </div>
                  </div>
                  <Badge tone="amber">Pending</Badge>
                  <button
                    className="btn-sm btn-outline"
                    onClick={() => navigate(`/verifications/${item.sellerProfileId}`)}
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>Recent activity</span>
              <a href="/audit-logs" onClick={go(navigate, '/audit-logs')}>
                View all
              </a>
            </div>
            {logs.length === 0 ? (
              <div className="panel-row muted">No admin actions yet.</div>
            ) : (
              logs.slice(0, 6).map((log) => (
                <div className="panel-row" key={log.id}>
                  <div className="grow">
                    <div>
                      <span className="strong">{log.adminName}</span> ·{' '}
                      {actionLabel(log.action)}
                    </div>
                    <div className="muted">{log.targetLabel ?? '—'}</div>
                  </div>
                  <div className="muted">{relativeTime(log.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="quick-actions" style={{ marginBottom: 16 }}>
            <h3>Quick actions</h3>
            <button className="gold" onClick={() => navigate('/verifications')}>
              Review verifications
            </button>
            <button onClick={() => navigate('/listings')}>Moderate listings</button>
            <button onClick={() => navigate('/reports')}>Open reports</button>
            <button onClick={() => navigate('/users')} style={{ marginBottom: 0 }}>
              Manage users
            </button>
          </div>

          <div className="panel">
            <div className="panel-head">Platform totals</div>
            <Total label="Total sellers" value={stats.totalSellers} />
            <Total label="Total listings" value={stats.totalListings} />
            <Total label="Archived listings" value={stats.archivedListings} />
            <Total label="Suspended listings" value={stats.suspendedListings} />
            <Total label="Purchase requests" value={stats.purchaseRequests} />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'warn' | 'bad';
}) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel-row">
      <span className="grow">{label}</span>
      <span className="strong">{value}</span>
    </div>
  );
}

/** Keeps the "View all" links as real anchors without a full page reload. */
const go = (navigate: (to: string) => void, to: string) => (event: React.MouseEvent) => {
  event.preventDefault();
  navigate(to);
};

const sellerTypeLabel = (type: string | null) =>
  type === 'BUSINESS' ? 'Business' : type === 'INDIVIDUAL' ? 'Individual' : '—';

export function actionLabel(action: string) {
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
