import ENV from '@/config/env';
import apiClient from '@/api/client';
import type { DealAlert, CreateDealAlertRequest } from '@/types/dealAlert.types';

let mockAlerts: DealAlert[] = [];

export const getDealAlerts = async (): Promise<DealAlert[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockAlerts;
  }
  const response = await apiClient.get('/deal-alerts');
  return response.data.data as DealAlert[];
};

export const createDealAlert = async (
  data: CreateDealAlertRequest
): Promise<DealAlert> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newAlert: DealAlert = {
      id: `alert-${Date.now()}`,
      buyerId: 'user-001',
      category: data.category,
      maxPrice: data.maxPrice ?? null,
      keywords: data.keywords ?? null,
      location: data.location ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockAlerts.push(newAlert);
    return newAlert;
  }
  const response = await apiClient.post('/deal-alerts', data);
  return response.data.data as DealAlert;
};

export const deleteDealAlert = async (id: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    mockAlerts = mockAlerts.filter((a) => a.id !== id);
    return;
  }
  await apiClient.delete(`/deal-alerts/${id}`);
};
