import { useState } from 'react';
import { api } from '../lib/api';
import type { AdminUser } from '../lib/types';
import {
  Badge,
  Chips,
  Empty,
  ErrorNote,
  Loading,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'SELLERS' | 'BUYERS';

export default function Users() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, error, loading } = useLoad(
    () => api.get<AdminUser[]>('/admin/users'),
    reloadKey
  );

  if (loading) return <Loading what="users" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const rows = all.filter((user) => {
    if (filter === 'ACTIVE') return user.accountStatus === 'ACTIVE';
    if (filter === 'SUSPENDED') return user.accountStatus === 'SUSPENDED';
    if (filter === 'SELLERS') return user.role === 'SELLER';
    if (filter === 'BUYERS') return user.role === 'BUYER';
    return true;
  });

  const suspend = async () => {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.put(`/admin/users/${target.id}/suspend`, { reason });
      setTarget(null);
      setReason('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  const reactivate = async (user: AdminUser) => {
    setActionError(null);
    try {
      await api.put(`/admin/users/${user.id}/reactivate`);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    }
  };

  const count = (predicate: (u: AdminUser) => boolean) => all.filter(predicate).length;

  return (
    <>
      {actionError != null && <ErrorNote error={actionError} />}

      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'ACTIVE', label: `Active (${count((u) => u.accountStatus === 'ACTIVE')})` },
          { value: 'SUSPENDED', label: `Suspended (${count((u) => u.accountStatus === 'SUSPENDED')})` },
          { value: 'SELLERS', label: `Sellers (${count((u) => u.role === 'SELLER')})` },
          { value: 'BUYERS', label: `Buyers (${count((u) => u.role === 'BUYER')})` },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No users here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Role</th>
                <th>Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="strong">{user.name}</td>
                  <td>{user.phone}</td>
                  <td>
                    {[user.cityTown, user.region].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>{user.role === 'SELLER' ? 'Seller' : 'Buyer'}</td>
                  <td>
                    {user.accountStatus === 'SUSPENDED' ? (
                      <Badge tone="red">Suspended</Badge>
                    ) : (
                      <Badge tone="green">Active</Badge>
                    )}
                  </td>
                  <td>
                    {user.accountStatus === 'SUSPENDED' ? (
                      <button
                        className="btn-sm btn-outline"
                        onClick={() => reactivate(user)}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        className="btn-sm btn-outline-danger"
                        onClick={() => setTarget(user)}
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {target && (
        <div className="modal-backdrop" onClick={() => setTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Suspend {target.name}?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              They will not be able to sign in until you reactivate them.
            </p>
            <label htmlFor="user-reason">Why are you doing this?</label>
            <textarea
              id="user-reason"
              rows={3}
              placeholder="e.g. Repeated no-shows after accepting purchase requests"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={suspend}
                disabled={busy || !reason.trim()}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
