import ENV from '@/config/env';
import apiClient from '@/api/client';
import {
  MOCK_NOTIFICATIONS,
  MOCK_UNREAD_COUNT,
} from '@/mocks/notification.mock';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  ReferenceType,
} from '@/types/notification.types';
import type { NotificationCategory } from '@/constants/app';

// The backend returns a flat list of { id, title, message, type, isRead,
// relatedId, createdAt } — map it to the app's Notification shape.
interface RawNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: number | null;
  createdAt: string;
}

const CATEGORY_BY_TYPE: Record<string, NotificationCategory> = {
  DEAL_ALERT: 'LISTING',
  PURCHASE_REQUEST: 'PURCHASE_REQUEST',
  TRANSACTION: 'TRANSACTION',
  REVIEW: 'TRANSACTION',
  PAYMENT: 'TRANSACTION',
};

const REFERENCE_BY_TYPE: Record<string, ReferenceType> = {
  DEAL_ALERT: 'listing',
  PURCHASE_REQUEST: 'purchase_request',
  TRANSACTION: 'transaction',
  REVIEW: 'transaction',
  PAYMENT: 'transaction',
};

const mapNotification = (raw: RawNotification): Notification => ({
  id: String(raw.id),
  userId: '',
  category: CATEGORY_BY_TYPE[raw.type] ?? 'TRANSACTION',
  title: raw.title,
  body: raw.message,
  status: raw.isRead ? 'READ' : 'UNREAD',
  referenceType: REFERENCE_BY_TYPE[raw.type] ?? null,
  referenceId: raw.relatedId != null ? String(raw.relatedId) : null,
  createdAt: raw.createdAt,
});

export const getNotifications = async (): Promise<NotificationListResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      content: MOCK_NOTIFICATIONS,
      page: 0,
      size: 20,
      totalElements: MOCK_NOTIFICATIONS.length,
      totalPages: 1,
      hasNext: false,
    };
  }
  const response = await apiClient.get('/notifications');
  const content = (response.data.data as RawNotification[]).map(mapNotification);
  return {
    content,
    page: 0,
    size: content.length,
    totalElements: content.length,
    totalPages: 1,
    hasNext: false,
  };
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { count: MOCK_UNREAD_COUNT };
  }
  const response = await apiClient.get('/notifications/unread-count');
  return response.data.data as UnreadCountResponse;
};

export const markNotificationAsRead = async (
  id: string
): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const notification = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (notification) {
      notification.status = 'READ';
    }
    return;
  }
  await apiClient.put(`/notifications/${id}/read`);
};

export const markNotificationAsUnread = async (
  id: string
): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const notification = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (notification) {
      notification.status = 'UNREAD';
    }
    return;
  }
  await apiClient.put(`/notifications/${id}/unread`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    MOCK_NOTIFICATIONS.forEach((n) => {
      n.status = 'READ';
    });
    return;
  }
  await apiClient.put('/notifications/read-all');
};