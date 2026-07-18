import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdminListing } from '../lib/types';
import { ErrorNote, Loading, formatDate, useLoad } from '../components/common';
import { ListingBadge } from './Listings';

/** The mockup's preset reasons, so moderation stays consistent between admins. */
const REASONS = [
  'Fraud',
  'Fake Product',
  'Duplicate Listing',
  'Prohibited Product',
  'Misleading Information',
];

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<'suspend' | 'archive' | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, error, loading } = useLoad(
    () => api.get<AdminListing>(`/admin/listings/${id}`),
    `${id}-${reloadKey}`
  );

  if (loading) return <Loading what="this listing" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  const act = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const combined = [reason, note.trim()].filter(Boolean).join(' — ');
      await api.put(`/admin/listings/${id}/${mode}`, { reason: combined });
      setMode(null);
      setReason('');
      setNote('');
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setActionError(null);
    try {
      await api.put(`/admin/listings/${id}/restore`);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setActionError(caught);
    }
  };

  const isLive = data.listingStatus === 'ACTIVE';

  return (
    <>
      <button className="back-link" onClick={() => navigate('/listings')}>
        ← Back to listings
      </button>

      {actionError != null && <ErrorNote error={actionError} />}

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <h2>{data.title}</h2>
            <div className="muted">{data.category}</div>
          </div>
          <ListingBadge status={data.listingStatus} />
        </div>

        {data.imageUrls?.length > 0 ? (
          <img className="doc-image" src={data.imageUrls[0]} alt={data.title} />
        ) : (
          <div className="doc-missing">No image</div>
        )}

        <p style={{ marginTop: 14 }}>{data.description ?? '—'}</p>

        <div className="detail-grid" style={{ marginTop: 14 }}>
          <Field label="Current price" value={`GHS ${data.currentPrice}`} />
          <Field label="Original price" value={`GHS ${data.originalPrice}`} />
          <Field label="Quantity" value={`${data.quantity} ${data.unit}`} />
          <Field label="Seller" value={data.sellerName ?? '—'} />
          <Field label="Expiry date" value={formatDate(data.expiryDate)} />
          <Field label="Listed on" value={formatDate(data.createdAt)} />
        </div>
      </div>

      <div className="action-bar">
        {isLive ? (
          <>
            <button className="btn-outline-danger" onClick={() => setMode('suspend')}>
              Suspend listing
            </button>
            <button className="btn-outline-danger" onClick={() => setMode('archive')}>
              Archive listing
            </button>
          </>
        ) : (
          <button className="btn-gold" onClick={restore}>
            Restore listing
          </button>
        )}
      </div>

      {mode && (
        <div className="modal-backdrop" onClick={() => setMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{mode === 'suspend' ? 'Suspend' : 'Archive'} this listing?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              "{data.title}" will be inaccessible until restored.
            </p>

            <label>Why are you doing this?</label>
            <div className="reason-chips">
              {REASONS.map((option) => (
                <button
                  key={option}
                  className={`chip ${reason === option ? 'on' : ''}`}
                  onClick={() => setReason(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <label htmlFor="note">Additional note (optional)</label>
            <textarea
              id="note"
              rows={3}
              placeholder="e.g. Same product listed three times by this seller"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setMode(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={act} disabled={busy || !reason}>
                {mode === 'suspend' ? 'Suspend' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
