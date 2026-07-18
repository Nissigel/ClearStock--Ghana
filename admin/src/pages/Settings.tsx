import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { applyTheme, getTheme, type Theme } from '../lib/theme';
import { ErrorNote } from '../components/common';

export default function Settings() {
  const { admin } = useAuth();
  const [theme, setTheme] = useState<Theme>(getTheme);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  const toggleTheme = () => {
    const value: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(value);
    setTheme(value);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setDone(false);

    // Caught here rather than at the server, so the mistake is obvious before
    // a round trip and the current password is never sent for a typo.
    if (next !== confirm) {
      setError(new Error('The new passwords do not match'));
      return;
    }
    if (next.length < 8) {
      setError(new Error('The new password must be at least 8 characters'));
      return;
    }

    setBusy(true);
    try {
      await api.put('/admin/auth/password', {
        currentPassword: current,
        newPassword: next,
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="settings-card">
        <h3>Your profile</h3>
        <div className="detail-grid">
          <div>
            <div className="detail-label">Name</div>
            <div>{admin?.name}</div>
          </div>
          <div>
            <div className="detail-label">Email</div>
            <div>{admin?.email}</div>
          </div>
          <div>
            <div className="detail-label">Role</div>
            <div>{admin?.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}</div>
          </div>
        </div>
      </div>

      <form className="settings-card" onSubmit={submit}>
        <h3>Change password</h3>

        {error != null && <ErrorNote error={error} />}
        {done && <div className="ok-note">Your password has been updated.</div>}

        <div className="field">
          <label htmlFor="current">Current password</label>
          <input
            id="current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="next">New password</label>
          <input
            id="next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <button className="btn-gold" type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="settings-card">
        <h3>Appearance</h3>
        <div className="switch-row">
          <div className="grow">
            <div className="strong">Dark mode</div>
            <div className="muted">Easier on the eyes in low light</div>
          </div>
          <button
            type="button"
            className={`switch ${theme === 'dark' ? 'on' : ''}`}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode"
            onClick={toggleTheme}
          />
        </div>
      </div>
    </>
  );
}
