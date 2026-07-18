export type ReportType = 'LISTING' | 'USER';

export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reportType: ReportType;
  targetId: string;
  /** Product name or person's name, for display. */
  targetLabel: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface CreateReportRequest {
  reportType: ReportType;
  /** Listing id for LISTING reports, user id for USER reports. */
  targetId: string;
  reason: string;
  /** Short label chosen from a list, shown to moderators for triage. */
  category?: string;
}
