import { useState } from 'react';
import { api } from '../lib/api';
import type { AdminPayments, EscrowState } from '../lib/types';
import {
  Badge,
  Chips,
  Empty,
  ErrorNote,
  Loading,
  formatDate,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | EscrowState;

export default function Payments() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, error, loading } = useLoad(() =>
    api.get<AdminPayments>('/admin/payments')
  );

  if (loading) return <Loading what="payments" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  const all = data.transactions ?? [];
  const rows = filter === 'ALL' ? all : all.filter((t) => t.escrowState === filter);
  const count = (state: EscrowState) =>
    all.filter((t) => t.escrowState === state).length;

  return (
    <>
      {/* Escrow is the part people misunderstand, so the two buckets lead:
          money ClearStock is holding, and money already released. */}
      <div className="stat-grid">
        <div className="stat warn">
          <div className="stat-label">Held in escrow</div>
          <div className="stat-value">GHS {data.heldTotal}</div>
          <div className="stat-label">
            {data.heldCount} awaiting collection
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Released to sellers</div>
          <div className="stat-value">GHS {data.releasedTotal}</div>
          <div className="stat-label">{data.releasedCount} completed</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            ClearStock commission ({data.commissionRate}%)
          </div>
          <div className="stat-value">GHS {data.commissionTotal}</div>
          <div className="stat-label">on GHS {data.grossTotal} gross</div>
        </div>
        <div className="stat">
          <div className="stat-label">Net owed to sellers</div>
          <div className="stat-value">GHS {data.netToSellersTotal}</div>
          <div className="stat-label">after commission</div>
        </div>
      </div>

      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'HELD', label: `Held (${count('HELD')})` },
          { value: 'RELEASED', label: `Released (${count('RELEASED')})` },
          { value: 'UNPAID', label: `Unpaid (${count('UNPAID')})` },
          { value: 'CANCELLED', label: `Cancelled (${count('CANCELLED')})` },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No payments here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Net to seller</th>
                <th>Escrow</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr key={tx.id}>
                  <td className="strong">{tx.listingTitle}</td>
                  <td>{tx.buyerName}</td>
                  <td>{tx.sellerName}</td>
                  <td>GHS {tx.amount}</td>
                  <td className="muted">GHS {tx.commission}</td>
                  <td>GHS {tx.netToSeller}</td>
                  <td>
                    <EscrowBadge state={tx.escrowState} />
                  </td>
                  <td className="muted">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ marginTop: 14, maxWidth: 640 }}>
        Money is held until the buyer confirms collection, then released to the
        seller less {data.commissionRate}% commission. Payouts are settled
        manually — this screen shows what is owed, not what has been sent.
      </p>
    </>
  );
}

function EscrowBadge({ state }: { state: EscrowState }) {
  if (state === 'HELD') return <Badge tone="amber">Held</Badge>;
  if (state === 'RELEASED') return <Badge tone="green">Released</Badge>;
  if (state === 'CANCELLED') return <Badge tone="red">Cancelled</Badge>;
  return <Badge tone="grey">Unpaid</Badge>;
}
