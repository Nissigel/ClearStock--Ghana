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
  /**
   * Which mode you must be in to act on this notification, or null when either
   * mode can open it. A single account is both buyer and seller with one shared
   * inbox, so this drives the "switch mode to view" prompt.
   */
  role: NotificationRole | null;
  createdAt: string;
}

export type NotificationRole = 'BUYER' | 'SELLER';

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