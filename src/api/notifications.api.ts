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
} from '@/types/notification.types';

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
  return response.data.data as NotificationListResponse;
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