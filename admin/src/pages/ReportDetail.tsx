import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdminReport } from '../lib/types';
import {
  Badge,
  ErrorNote,
  Loading,
  formatDateTime,
  useLoad,
} from '../components/common';

interface ReportDetail {
  report: AdminReport;
  reason: string;
  otherReports: AdminReport[];
  otherOpenCount: number;
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState<'action' | 'dismiss' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, error, loading } = useLoad(
    () => api.get<ReportDetail>(`/admin/reports/${id}`),
    `${id}-${reloadKey}`
  );

  if (loading) return <Loading what="this report" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  const { report, reason, otherReports, otherOpenCount } = data;
  const isOpen = report.status === 'OPEN' || report.status === 'REVIEWING';

  const confirm = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await api.put(`/admin/reports/${id}/${pending}`, { note: note.trim() || null });
      setPending(null);
      setNote('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  const subjectLabel =
    report.targetType === 'LISTING' ? 'a listing' : report.targetType.toLowerCase();

  return (
    <>
      <button className="back-link" onClick={() => navigate('/reports')}>
        ← Back to reports
      </button>

      {actionError != null && <ErrorNote error={actionError} />}

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <div className="muted">Report on {subjectLabel}</div>
            <h2>{report.targetLabel}</h2>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* A repeat target is the single most useful thing to know before
            deciding, so it goes above the detail rather than below it. */}
        {otherOpenCount > 0 && (
          <div className="alert-strip">
            ⚠ {otherOpenCount} other open{' '}
            {otherOpenCount === 1 ? 'report' : 'reports'} against this{' '}
            {report.targetType === 'LISTING' ? 'listing' : 'person'}
          </div>
        )}

        <div className="detail-grid">
          <div>
            <div className="detail-label">Category</div>
            <div>{report.category}</div>
          </div>
          <div>
            <div className="detail-label">Reported by</div>
            <div>{report.reporterName}</div>
          </div>
          <div>
            <div className="detail-label">Date</div>
            <div>{formatDateTime(report.createdAt)}</div>
          </div>
        </div>

        <div className="quote-box">
          <div className="detail-label">Reason given</div>
          <div>{reason}</div>
        </div>

        {report.targetId != null && report.targetType === 'LISTING' && (
          <p style={{ marginBottom: 0 }}>
            <a
              href={`/listings/${report.targetId}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/listings/${report.targetId}`);
              }}
            >
              View reported listing →
            </a>
          </p>
        )}
        {report.targetId != null && report.targetType !== 'LISTING' && (
          <p style={{ marginBottom: 0 }}>
            <a
              href="/users"
              onClick={(e) => {
                e.preventDefault();
                navigate('/users');
              }}
            >
              View reported user →
            </a>
          </p>
        )}
      </div>

      {otherReports.length > 0 && (
        <div className="detail-card">
          <h3 style={{ marginTop: 0 }}>
            Other reports about {report.targetLabel} ({otherReports.length})
          </h3>
          {otherReports.map((other) => (
            <div className="panel-row" key={other.id}>
              <div className="grow">
                <div className="strong">{other.category}</div>
                <div className="muted">
                  by {other.reporterName} · {formatDateTime(other.createdAt)}
                </div>
              </div>
              <StatusBadge status={other.status} />
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="action-bar">
          <button className="btn-gold" onClick={() => setPending('action')}>
            Take action
          </button>
          <button className="btn-outline" onClick={() => setPending('dismiss')}>
            Dismiss report
          </button>
        </div>
      )}

      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {pending === 'action' ? 'Take action on' : 'Dismiss'} this report?
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {pending === 'action'
                ? `This marks the complaint about ${report.targetLabel} as actioned. Suspending the listing or the account is a separate step.`
                : `This closes the complaint about ${report.targetLabel} with no action taken.`}
            </p>

            <label htmlFor="report-note">Note (optional)</label>
            <textarea
              id="report-note"
              rows={3}
              placeholder={
                pending === 'action'
                  ? 'e.g. Seller warned and listing suspended'
                  : 'e.g. No evidence of wrongdoing'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className={pending === 'action' ? 'btn-gold' : 'btn-danger'}
                onClick={confirm}
                disabled={busy}
              >
                {busy
                  ? 'Working…'
                  : pending === 'action'
                    ? 'Confirm action'
                    : 'Confirm dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StatusBadge({ status }: { status: AdminReport['status'] }) {
  if (status === 'RESOLVED') return <Badge tone="green">Actioned</Badge>;
  if (status === 'DISMISSED') return <Badge tone="grey">Dismissed</Badge>;
  return <Badge tone="amber">Open</Badge>;
}
