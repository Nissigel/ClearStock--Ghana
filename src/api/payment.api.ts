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
      transactionId: data.transactionId,
      paymentReference: `REF-${Date.now()}`,
      authorizationUrl: 'https://example.com/mock-checkout',
      paymentStatus: 'PENDING_PAYMENT',
      message: 'Payment initiated',
    };
  }
  const response = await apiClient.post('/payments/initiate', data);
  return response.data.data as PaymentResponse;
};

export const verifyPayment = async (
  paymentReference: string
): Promise<PaymentResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      transactionId: 'txn-001',
      paymentReference,
      authorizationUrl: 'https://example.com/mock-checkout',
      paymentStatus: 'PAYMENT_SUCCESSFUL',
      message: 'Payment verified',
    };
  }
  const response = await apiClient.get(`/payments/verify/${paymentReference}`);
  return response.data.data as PaymentResponse;
};