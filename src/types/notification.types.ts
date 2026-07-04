import type { NotificationCategory } from '@/constants/app';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  status: NotificationStatus;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  content: Notification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export type NotificationStatus = 'UNREAD' | 'READ';

export type ReferenceType =
  | 'listing'
  | 'conversation'
  | 'purchase_request'
  | 'transaction';