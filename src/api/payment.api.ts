import ENV from '@/config/env';
import apiClient from '@/api/client';
import type {
  InitiatePaymentRequest,
  PaymentResponse,
} from '@/types/payment.types';

export const initiatePayment = async (
  data: InitiatePaymentRequest
): Promise<PaymentResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 2000));
    return {
      id: `pay-${Date.now()}`,
      transactionId: data.transactionId,
      amount: data.amount,
      status: 'SUCCESS',
      paymentMethod: data.paymentMethod,
      reference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }
  const response = await apiClient.post('/payments/initiate', data);
  return response.data.data as PaymentResponse;
};

export const verifyPayment = async (
  reference: string
): Promise<PaymentResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      id: `pay-001`,
      transactionId: 'txn-001',
      amount: 850,
      status: 'SUCCESS',
      paymentMethod: 'MOMO',
      reference,
      createdAt: new Date().toISOString(),
    };
  }
  const response = await apiClient.get(`/payments/verify/${reference}`);
  return response.data.data as PaymentResponse;
};