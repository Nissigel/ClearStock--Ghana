import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Verification, VerificationStatus } from '../lib/types';
import {
  Badge,
  Chips,
  Empty,
  ErrorNote,
  Loading,
  relativeTime,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | VerificationStatus;

export default function Verifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('PENDING');

  const { data, error, loading } = useLoad(
    () => api.get<Verification[]>('/admin/verifications'),
    0
  );

  if (loading) return <Loading what="verifications" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const count = (status: VerificationStatus) =>
    all.filter((v) => v.verificationStatus === status).length;

  const rows =
    filter === 'ALL' ? all : all.filter((v) => v.verificationStatus === filter);

  return (
    <>
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'PENDING', label: `Pending (${count('PENDING')})` },
          { value: 'VERIFIED', label: `Verified (${count('VERIFIED')})` },
          { value: 'REJECTED', label: `Rejected (${count('REJECTED')})` },
        ]}
      />

      <p className="muted" style={{ marginTop: -6 }}>
        Oldest applications first
      </p>

      {rows.length === 0 ? (
        <Empty>No applications here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Business</th>
                <th>Type</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.sellerProfileId}
                  className="clickable"
                  onClick={() => navigate(`/verifications/${row.sellerProfileId}`)}
                >
                  <td className="strong">{row.sellerName}</td>
                  <td>{row.businessName ?? '—'}</td>
                  <td>{typeLabel(row.sellerType)}</td>
                  <td>{location(row)}</td>
                  <td className="muted">{relativeTime(row.documentsSubmittedAt)}</td>
                  <td>
                    <StatusBadge status={row.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === 'VERIFIED') return <Badge tone="green">Verified</Badge>;
  if (status === 'PENDING') return <Badge tone="amber">Pending</Badge>;
  if (status === 'REJECTED') return <Badge tone="red">Rejected</Badge>;
  return <Badge tone="grey">Unverified</Badge>;
}

export const typeLabel = (type: string | null) =>
  type === 'BUSINESS' ? 'Business' : type === 'INDIVIDUAL' ? 'Individual' : '—';

const location = (row: Verification) =>
  [row.cityTown, row.region].filter(Boolean).join(', ') || '—';
