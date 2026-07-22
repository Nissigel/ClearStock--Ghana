import ENV from '@/config/env';
import apiClient from '@/api/client';
import type {
  Report,
  CreateReportRequest,
} from '@/types/report.types';

interface RawReport {
  id: number;
  reportType: Report['reportType'];
  targetId: number | null;
  targetLabel: string;
  reason: string;
  status: Report['status'];
  createdAt: string;
}

const mapReport = (raw: RawReport): Report => ({
  id: String(raw.id),
  reportType: raw.reportType,
  targetId: raw.targetId != null ? String(raw.targetId) : '',
  targetLabel: raw.targetLabel,
  reason: raw.reason,
  status: raw.status,
  createdAt: raw.createdAt,
});

export const createReport = async (
  data: CreateReportRequest
): Promise<Report> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    throw new Error('Not available in mock mode.');
  }
  // Backend takes a numeric target id.
  const response = await apiClient.post('/reports', {
    reportType: data.reportType,
    targetId: Number(data.targetId),
    reason: data.reason,
    category: data.category,
  });
  return mapReport(response.data.data as RawReport);
};

/** Complaints the current user has submitted. */
export const getMyReports = async (): Promise<Report[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return [];
  }
  const response = await apiClient.get('/reports');
  return (response.data.data as RawReport[]).map(mapReport);
};
