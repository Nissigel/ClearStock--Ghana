import { useState } from 'react';
import { api } from '../lib/api';
import type { AuditLog } from '../lib/types';
import {
  Chips,
  Empty,
  ErrorNote,
  Loading,
  formatDateTime,
  useLoad,
} from '../components/common';
import { actionLabel } from './Dashboard';

type Filter = 'ALL' | 'VERIFICATION' | 'LISTING' | 'USER' | 'REPORT' | 'ADMIN';

/** Approvals and restorations read as positive, removals as negative. */
const POSITIVE = new Set([
  'APPROVED_VERIFICATION',
  'REACTIVATED_USER',
  'RESTORED_LISTING',
  'ACTIONED_REPORT',
  'CREATED_ADMIN',
  'ENABLED_ADMIN',
]);

export default function AuditLogs() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [adminFilter, setAdminFilter] = useState<string>('EVERYONE');

  const { data, error, loading } = useLoad(() => api.get<AuditLog[]>('/admin/audit-logs'));

  if (loading) return <Loading what="the audit log" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const admins = Array.from(new Set(all.map((log) => log.adminName)));

  const rows = all.filter((log) => {
    const typeOk = filter === 'ALL' || log.targetType === filter;
    const adminOk = adminFilter === 'EVERYONE' || log.adminName === adminFilter;
    return typeOk && adminOk;
  });

  const count = (type: Filter) =>
    type === 'ALL' ? all.length : all.filter((l) => l.targetType === type).length;

  return (
    <>
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${count('ALL')})` },
          { value: 'VERIFICATION', label: `Verification (${count('VERIFICATION')})` },
          { value: 'LISTING', label: `Listing (${count('LISTING')})` },
          { value: 'USER', label: `User (${count('USER')})` },
          { value: 'REPORT', label: `Report (${count('REPORT')})` },
          { value: 'ADMIN', label: `Admin (${count('ADMIN')})` },
        ]}
      />

      <div className="filters" style={{ marginTop: -6 }}>
        <span className="muted">Filter by admin:</span>
        <button
          className={`chip ${adminFilter === 'EVERYONE' ? 'on' : ''}`}
          onClick={() => setAdminFilter('EVERYONE')}
        >
          Everyone ({all.length})
        </button>
        {admins.map((name) => (
          <button
            key={name}
            className={`chip ${adminFilter === name ? 'on' : ''}`}
            onClick={() => setAdminFilter(name)}
          >
            {name} ({all.filter((l) => l.adminName === name).length})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>No admin actions recorded yet.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Target</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        marginRight: 8,
                        background: POSITIVE.has(log.action)
                          ? 'var(--green-500)'
                          : 'var(--red)',
                      }}
                    />
                    {actionLabel(log.action)}
                  </td>
                  <td>{log.adminName}</td>
                  <td className="strong">{log.targetLabel ?? '—'}</td>
                  <td className="muted">{log.note ?? '—'}</td>
                  <td className="muted">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
