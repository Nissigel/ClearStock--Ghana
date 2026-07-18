import { useState } from 'react';
import { api } from '../lib/api';
import type { AdminReview } from '../lib/types';
import {
  Chips,
  Empty,
  ErrorNote,
  Loading,
  formatDate,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | 'LOW' | 'HIGH' | 'WITH_COMMENT';

export default function Reviews() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, error, loading } = useLoad(() =>
    api.get<AdminReview[]>('/admin/reviews')
  );

  if (loading) return <Loading what="reviews" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const rows = all.filter((review) => {
    if (filter === 'LOW') return review.rating <= 2;
    if (filter === 'HIGH') return review.rating >= 4;
    if (filter === 'WITH_COMMENT') return !!review.comment?.trim();
    return true;
  });

  const average =
    all.length > 0
      ? (all.reduce((sum, r) => sum + r.rating, 0) / all.length).toFixed(1)
      : '—';
  const lowCount = all.filter((r) => r.rating <= 2).length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Total reviews</div>
          <div className="stat-value">{all.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Average rating</div>
          <div className="stat-value">{average}</div>
        </div>
        {/* Low ratings are the ones worth an admin's attention — they are
            where a moderation problem usually shows up first. */}
        <div className={`stat ${lowCount > 0 ? 'bad' : ''}`}>
          <div className="stat-label">Low ratings (1–2★)</div>
          <div className="stat-value">{lowCount}</div>
        </div>
      </div>

      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'LOW', label: `Low 1–2★ (${lowCount})` },
          {
            value: 'HIGH',
            label: `High 4–5★ (${all.filter((r) => r.rating >= 4).length})`,
          },
          {
            value: 'WITH_COMMENT',
            label: `With comment (${all.filter((r) => !!r.comment?.trim()).length})`,
          },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No reviews here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rating</th>
                <th>About</th>
                <th>By</th>
                <th>Listing</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((review) => (
                <tr key={review.id}>
                  <td>
                    <Stars rating={review.rating} />
                  </td>
                  <td className="strong">{review.revieweeName}</td>
                  <td>{review.reviewerName}</td>
                  <td className="muted">{review.listingTitle}</td>
                  <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                    {review.comment?.trim() ? review.comment : <span className="muted">—</span>}
                  </td>
                  <td className="muted">{formatDate(review.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      title={`${rating} out of 5`}
      style={{ color: 'var(--gold)', whiteSpace: 'nowrap', fontSize: 14 }}
    >
      {'★'.repeat(rating)}
      <span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}
