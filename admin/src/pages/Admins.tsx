import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Admin } from '../lib/types';
import {
  Badge,
  Empty,
  ErrorNote,
  Loading,
  formatDate,
  useLoad,
} from '../components/common';

export default function Admins() {
  const { admin: current } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, error, loading } = useLoad(
    () => api.get<Admin[]>('/admin/admins'),
    reloadKey
  );

  if (loading) return <Loading what="admins" />;
  if (error) return <ErrorNote error={error} />;

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await api.post('/admin/admins', {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setCreating(false);
      setName('');
      setEmail('');
      setPassword('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (target: Admin) => {
    setActionError(null);
    try {
      await api.put(`/admin/admins/${target.id}/${target.active ? 'disable' : 'enable'}`);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    }
  };

  const rows = data ?? [];

  return (
    <>
      {actionError != null && <ErrorNote error={actionError} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn-gold" onClick={() => setCreating(true)}>
          + Create admin
        </button>
      </div>

      {rows.length === 0 ? (
        <Empty>No admin accounts yet.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Added on</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="strong">
                    {row.name}
                    {row.id === current?.id && <span className="muted"> (you)</span>}
                  </td>
                  <td>{row.email}</td>
                  <td>
                    {row.role === 'SUPER_ADMIN' ? (
                      <Badge tone="gold">Super admin</Badge>
                    ) : (
                      <Badge tone="grey">Admin</Badge>
                    )}
                  </td>
                  <td>
                    {row.active ? (
                      <Badge tone="green">Active</Badge>
                    ) : (
                      <Badge tone="red">Disabled</Badge>
                    )}
                  </td>
                  <td className="muted">{formatDate(row.createdAt)}</td>
                  <td>
                    {/* The super admin cannot be disabled, and disabling
                        yourself would lock you out mid-session. */}
                    {row.role !== 'SUPER_ADMIN' && row.id !== current?.id && (
                      <button
                        className={`btn-sm ${row.active ? 'btn-outline-danger' : 'btn-gold'}`}
                        onClick={() => toggle(row)}
                      >
                        {row.active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div className="modal-backdrop" onClick={() => setCreating(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={create}
          >
            <h3>Create admin</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              They sign in with this email and password, and can change the
              password later.
            </p>

            <div className="field">
              <label htmlFor="admin-name">Name</label>
              <input
                id="admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="admin-password">Temporary password</label>
              <input
                id="admin-password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-gold" disabled={busy}>
                {busy ? 'Creating…' : 'Create admin'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
