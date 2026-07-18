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
  const [shown, setShown] = useState(0);
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

  const images = data.imageUrls ?? [];
  const isLive = data.listingStatus === 'ACTIVE';

  // How far the price has fallen from its original towards the floor the
  // seller set. With no floor, measure against zero so the bar still means
  // something rather than disappearing.
  const original = Number(data.originalPrice);
  const current = Number(data.currentPrice);
  const floor = data.minimumAcceptablePrice != null
    ? Number(data.minimumAcceptablePrice)
    : 0;
  const span = original - floor;
  const dropped = span > 0 ? Math.min(100, Math.max(0, ((original - current) / span) * 100)) : 0;
  const discounted = current < original;

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

        {images.length > 0 ? (
          <>
            <img
              className="gallery-main"
              src={images[shown]}
              alt={data.title}
            />
            {images.length > 1 && (
              <>
                <div className="thumbs">
                  {images.map((url, index) => (
                    <button
                      key={url + index}
                      className={`thumb ${index === shown ? 'on' : ''}`}
                      onClick={() => setShown(index)}
                      aria-label={`Image ${index + 1}`}
                      style={{
                        backgroundImage: `url(${url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ))}
                </div>
                <div className="thumb-count">
                  {shown + 1} of {images.length} images
                </div>
              </>
            )}
          </>
        ) : (
          <div className="doc-missing">No image</div>
        )}

        <p style={{ marginTop: 14 }}>{data.description ?? '—'}</p>
      </div>

      <div className="detail-card">
        <h3 style={{ marginTop: 0 }}>
          {discounted ? 'Clearance price' : 'Price'}
        </h3>

        <div className="price-ends">
          <span>Original GHS {data.originalPrice}</span>
          {data.minimumAcceptablePrice != null && (
            <span>Floor GHS {data.minimumAcceptablePrice}</span>
          )}
        </div>
        <div className="price-track">
          <div className="price-fill" style={{ width: `${dropped}%` }} />
        </div>
        <div className="price-now">GHS {data.currentPrice}</div>

        <div className="detail-grid" style={{ marginTop: 16 }}>
          <div>
            <div className="detail-label">Quantity</div>
            <div>
              {data.quantity} {data.unit}
            </div>
          </div>
          <div>
            <div className="detail-label">Seller</div>
            <div>{data.sellerName ?? '—'}</div>
          </div>
          <div>
            <div className="detail-label">Expiry sensitive</div>
            <div>{data.expirySensitive ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="detail-label">Expiry date</div>
            <div>{formatDate(data.expiryDate)}</div>
          </div>
          <div>
            <div className="detail-label">Clearance ends</div>
            <div>{formatDate(data.clearanceEndDate)}</div>
          </div>
          <div>
            <div className="detail-label">Listed on</div>
            <div>{formatDate(data.createdAt)}</div>
          </div>
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
                {busy ? 'Working…' : mode === 'suspend' ? 'Suspend' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
