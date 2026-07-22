import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Verification } from '../lib/types';
import {
  ErrorNote,
  Loading,
  formatDate,
  useLoad,
} from '../components/common';
import { StatusBadge, typeLabel } from './Verifications';

export default function VerificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, error, loading } = useLoad(
    () => api.get<Verification>(`/admin/verifications/${id}`),
    `${id}-${reloadKey}`
  );

  if (loading) return <Loading what="this application" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  const isPending = data.verificationStatus === 'PENDING';

  const approve = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await api.put(`/admin/verifications/${id}/approve`);
      navigate('/verifications');
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await api.put(`/admin/verifications/${id}/reject`, { reason });
      setRejecting(false);
      setReason('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="back-link" onClick={() => navigate('/verifications')}>
        ← Back to verifications
      </button>

      {actionError != null && <ErrorNote error={actionError} />}

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <h2>{data.sellerName}</h2>
            <div className="muted">{data.businessName ?? 'No business name'}</div>
          </div>
          <StatusBadge status={data.verificationStatus} />
        </div>

        <div className="detail-grid">
          <Field label="Seller type" value={typeLabel(data.sellerType)} />
          <Field label="Region" value={data.region} />
          <Field label="City" value={data.cityTown} />
          <Field label="Market hub" value={data.marketHub} />
          <Field label="Ghana Card number" value={data.ghanaCardNumber} />
          <Field label="Submitted" value={formatDate(data.documentsSubmittedAt)} />
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="detail-label">Business description</div>
          <div>{data.businessDescription ?? '—'}</div>
        </div>

        {data.rejectionReason && (
          <div style={{ marginTop: 14 }}>
            <div className="detail-label">Previous rejection reason</div>
            <div>{data.rejectionReason}</div>
          </div>
        )}
      </div>

      <div className="detail-card">
        <h3 style={{ marginTop: 0 }}>Verification documents</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Confirm each document is clear and matches the seller's details before
          approving.
        </p>

        <div className="detail-label">Identity — Ghana Card (required)</div>
        {data.ghanaCardPhotoUrl ? (
          <a href={data.ghanaCardPhotoUrl} target="_blank" rel="noreferrer">
            <img className="doc-image" src={data.ghanaCardPhotoUrl} alt="Ghana Card" />
          </a>
        ) : (
          <div className="doc-missing">No Ghana Card photo submitted.</div>
        )}

        <div className="detail-label" style={{ marginTop: 18 }}>
          Business registration {data.businessRegUrl ? '' : '(not provided)'}
        </div>
        {data.businessRegUrl ? (
          <a href={data.businessRegUrl} target="_blank" rel="noreferrer">
            <img
              className="doc-image"
              src={data.businessRegUrl}
              alt="Business registration"
            />
          </a>
        ) : (
          <p className="muted" style={{ marginTop: 4 }}>
            This seller did not submit business registration papers — expected for
            individual sellers and small traders, but a registered business should
            have one.
          </p>
        )}
      </div>

      {isPending && (
        <div className="action-bar">
          <button
            className="btn-outline-danger"
            onClick={() => setRejecting(true)}
            disabled={busy}
          >
            Reject
          </button>
          <button className="btn-gold" onClick={approve} disabled={busy}>
            {busy ? 'Working…' : 'Approve'}
          </button>
        </div>
      )}

      {rejecting && (
        <div className="modal-backdrop" onClick={() => setRejecting(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this application?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {data.sellerName} will see this reason and can submit again.
            </p>
            <label htmlFor="reason">Why are you rejecting it?</label>
            <textarea
              id="reason"
              rows={3}
              placeholder="e.g. The Ghana Card photo is too blurred to read"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setRejecting(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={reject}
                disabled={busy || !reason.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div>{value ?? '—'}</div>
    </div>
  );
}
