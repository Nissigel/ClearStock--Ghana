import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdminListing, ListingStatus } from '../lib/types';
import {
  Badge,
  Chips,
  Empty,
  ErrorNote,
  Loading,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | ListingStatus;

export default function Listings() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, error, loading } = useLoad(() =>
    api.get<AdminListing[]>('/admin/listings')
  );

  if (loading) return <Loading what="listings" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const count = (status: ListingStatus) =>
    all.filter((l) => l.listingStatus === status).length;
  const rows = filter === 'ALL' ? all : all.filter((l) => l.listingStatus === filter);

  return (
    <>
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'ACTIVE', label: `Active (${count('ACTIVE')})` },
          { value: 'SUSPENDED', label: `Suspended (${count('SUSPENDED')})` },
          { value: 'ARCHIVED', label: `Archived (${count('ARCHIVED')})` },
          { value: 'OUT_OF_STOCK', label: `Out of stock (${count('OUT_OF_STOCK')})` },
          { value: 'EXPIRED', label: `Expired (${count('EXPIRED')})` },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No listings here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((listing) => (
                <tr
                  key={listing.id}
                  className="clickable"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                >
                  <td className="strong">{listing.title}</td>
                  <td>{listing.sellerName ?? '—'}</td>
                  <td>{listing.category}</td>
                  <td>GHS {listing.currentPrice}</td>
                  <td>
                    {listing.quantity} {listing.unit}
                  </td>
                  <td>
                    <ListingBadge status={listing.listingStatus} />
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

export function ListingBadge({ status }: { status: ListingStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge tone="green">Active</Badge>;
    case 'SUSPENDED':
      return <Badge tone="red">Suspended</Badge>;
    case 'ARCHIVED':
      return <Badge tone="grey">Archived</Badge>;
    case 'OUT_OF_STOCK':
      return <Badge tone="grey">Out of stock</Badge>;
    default:
      return <Badge tone="amber">Expired</Badge>;
  }
}
