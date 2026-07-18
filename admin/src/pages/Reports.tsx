import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdminReport } from '../lib/types';
import {
  Badge,
  Chips,
  Empty,
  ErrorNote,
  Loading,
  formatDate,
  useLoad,
} from '../components/common';

type Filter = 'ALL' | 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'SELLER' | 'BUYER' | 'LISTING';

export default function Reports() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('OPEN');

  const { data, error, loading } = useLoad(
    () => api.get<AdminReport[]>('/admin/reports')
  );

  if (loading) return <Loading what="reports" />;
  if (error) return <ErrorNote error={error} />;

  const all = data ?? [];
  const rows = all.filter((report) => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return report.status === 'OPEN' || report.status === 'REVIEWING';
    if (filter === 'RESOLVED') return report.status === 'RESOLVED';
    if (filter === 'DISMISSED') return report.status === 'DISMISSED';
    return report.targetType === filter;
  });

  const count = (predicate: (r: AdminReport) => boolean) =>
    all.filter(predicate).length;

  return (
    <>
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: `All (${all.length})` },
          { value: 'OPEN', label: `Open (${count((r) => r.status === 'OPEN' || r.status === 'REVIEWING')})` },
          { value: 'RESOLVED', label: `Actioned (${count((r) => r.status === 'RESOLVED')})` },
          { value: 'DISMISSED', label: `Dismissed (${count((r) => r.status === 'DISMISSED')})` },
          { value: 'SELLER', label: `On sellers (${count((r) => r.targetType === 'SELLER')})` },
          { value: 'BUYER', label: `On buyers (${count((r) => r.targetType === 'BUYER')})` },
          { value: 'LISTING', label: `On listings (${count((r) => r.targetType === 'LISTING')})` },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No reports here.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reported</th>
                <th>Type</th>
                <th>Category</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((report) => (
                <tr
                  key={report.id}
                  className="clickable"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <td className="strong">{report.targetLabel}</td>
                  <td>{label(report.targetType)}</td>
                  <td>{report.category}</td>
                  <td>{report.reporterName}</td>
                  <td className="muted">{formatDate(report.createdAt)}</td>
                  <td>
                    <ReportBadge status={report.status} />
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

function ReportBadge({ status }: { status: AdminReport['status'] }) {
  if (status === 'RESOLVED') return <Badge tone="green">Actioned</Badge>;
  if (status === 'DISMISSED') return <Badge tone="grey">Dismissed</Badge>;
  return <Badge tone="amber">Open</Badge>;
}

const label = (type: AdminReport['targetType']) =>
  type.charAt(0) + type.slice(1).toLowerCase();
