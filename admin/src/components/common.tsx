import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '../lib/api';

/** Small helpers shared by every screen, so the states look the same. */

export function Loading({ what }: { what: string }) {
  return <div className="state">Loading {what}…</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state">{children}</div>;
}

export function ErrorNote({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Something went wrong.';
  return <div className="error">{message}</div>;
}

export function Badge({
  tone,
  children,
}: {
  tone: 'green' | 'amber' | 'red' | 'grey' | 'gold';
  children: ReactNode;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="filters">
      {options.map((option) => (
        <button
          key={option.value}
          className={`chip ${option.value === value ? 'on' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Loads data on mount and again whenever `reloadKey` changes, which is how
 * screens refresh themselves after an action without a full page reload.
 */
export function useLoad<T>(load: () => Promise<T>, reloadKey: unknown = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return { data, error, loading };
}

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB') : '—';

export const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** "10 days ago" reads better than a date when triaging a queue. */
export function relativeTime(value: string | null) {
  if (!value) return '—';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
