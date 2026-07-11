import type { AxiosError } from 'axios';
import ENV from '@/config/env';
import apiClient from '@/api/client';
import {
  MOCK_PURCHASE_REQUESTS,
  MOCK_TRANSACTIONS,
} from '@/mocks/transaction.mock';
import type {
  PurchaseRequest,
  Transaction,
  TransactionResponse,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  CreatePurchaseRequestRequest,
  UpdateTransactionStatusRequest,
  VerifyTransactionOtpRequest,
} from '@/types/transaction.types';

// ─── Purchase Requests (Buyer) ───────────────────────────────────────────────

export const createPurchaseRequest = async (
  data: CreatePurchaseRequestRequest
): Promise<PurchaseRequest> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newRequest: PurchaseRequest = {
      id: Date.now(),
      listingId: data.listingId,
      listingProductName: 'Indomie Instant Noodles',
      buyerUserId: 1,
      sellerUserId: 2,
      buyerPhone: '0241234567',
      sellerPhone: '0201234560',
      conversationId: 'conv-001',
      requestedQuantity: data.requestedQuantity,
      status: 'PENDING',
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PURCHASE_REQUESTS.unshift(newRequest);
    return newRequest;
  }
  try {
    const response = await apiClient.post('/purchase-requests', data);
    return response.data.data as PurchaseRequest;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    console.error(
      'createPurchaseRequest failed:',
      axiosError.response?.data
    );
    throw new Error(
      axiosError.response?.data?.message ??
        'Failed to send request. Please try again.'
    );
  }
};

export const getBuyerPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PURCHASE_REQUESTS;
  }
  const response = await apiClient.get('/purchase-requests');
  return response.data.data as PurchaseRequest[];
};

export const getPurchaseRequestById = async (
  id: string
): Promise<PurchaseRequest> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const request = MOCK_PURCHASE_REQUESTS.find((r) => String(r.id) === id);
    if (!request) {
      throw new Error('Purchase request not found.');
    }
    return request;
  }
  const response = await apiClient.get(`/purchase-requests/${id}`);
  return response.data.data as PurchaseRequest;
};

export const cancelPurchaseRequest = async (id: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const request = MOCK_PURCHASE_REQUESTS.find((r) => String(r.id) === id);
    if (request) {
      request.status = 'CANCELLED';
    }
    return;
  }
  await apiClient.put(`/purchase-requests/${id}/cancel`);
};

// ─── Purchase Requests (Seller) ──────────────────────────────────────────────

export const getSellerPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PURCHASE_REQUESTS;
  }
  const response = await apiClient.get('/purchase-requests/incoming');
  return response.data.data as PurchaseRequest[];
};

export const acceptPurchaseRequest = async (
  id: string
): Promise<Transaction> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const request = MOCK_PURCHASE_REQUESTS.find((r) => String(r.id) === id);
    if (request) {
      request.status = 'ACCEPTED';
    }
    const newTransaction: Transaction = {
      id: Date.now(),
      purchaseRequestId: Number(id),
      listingId: request?.listingId ?? 0,
      listingProductName: request?.listingProductName ?? '',
      buyerUserId: request?.buyerUserId ?? 0,
      sellerUserId: request?.sellerUserId ?? 0,
      buyerPhone: request?.buyerPhone ?? '',
      sellerPhone: request?.sellerPhone ?? '',
      quantity: request?.requestedQuantity ?? 0,
      fulfillmentMethod: 'COLLECTION',
      paymentStatus: 'PENDING_PAYMENT',
      transactionStatus: 'PENDING_FULFILLMENT',
      otpCode: null,
      otpGeneratedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_TRANSACTIONS.unshift(newTransaction);
    return newTransaction;
  }
  const response = await apiClient.post('/transactions', {
    purchaseRequestId: Number(id),
    fulfillmentMethod: 'PICKUP',
  });
  return response.data.data as Transaction;
};

export const declinePurchaseRequest = async (
  id: string
): Promise<PurchaseRequest> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const request = MOCK_PURCHASE_REQUESTS.find((r) => String(r.id) === id);
    if (request) {
      request.status = 'DECLINED';
    }
    return request ?? MOCK_PURCHASE_REQUESTS[0];
  }
  const response = await apiClient.put(`/purchase-requests/${id}/decline`);
  return response.data.data as PurchaseRequest;
};

// ─── Transactions (Buyer) ────────────────────────────────────────────────────

export const getBuyerTransactions = async (): Promise<Transaction[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_TRANSACTIONS;
  }
  const response = await apiClient.get('/transactions');
  return response.data.data as Transaction[];
};

export const getTransactionById = async (
  id: string
): Promise<Transaction> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const transaction = MOCK_TRANSACTIONS.find((t) => String(t.id) === id);
    if (!transaction) {
      throw new Error('Transaction not found.');
    }
    return transaction;
  }
  const response = await apiClient.get(`/transactions/${id}`);
  return response.data.data as Transaction;
};

export const verifyTransactionOtp = async (
  id: string,
  data: VerifyTransactionOtpRequest
): Promise<Transaction> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (data.otp !== '123456') {
      throw new Error('Invalid OTP. Please try again.');
    }
    const transaction = MOCK_TRANSACTIONS.find((t) => String(t.id) === id);
    if (transaction) {
      transaction.transactionStatus = 'COMPLETED';
      transaction.completedAt = new Date().toISOString();
    }
    return transaction ?? MOCK_TRANSACTIONS[0];
  }
  const response = await apiClient.post(
    `/transactions/${id}/verify-otp`,
    data
  );
  return response.data.data as Transaction;
};

// ─── Transactions (Seller) ───────────────────────────────────────────────────

export const getSellerTransactions = async (): Promise<Transaction[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_TRANSACTIONS;
  }
  const response = await apiClient.get('/transactions');
  return response.data.data as Transaction[];
};

export const updateTransactionStatus = async (
  id: string,
  data: UpdateTransactionStatusRequest
): Promise<Transaction> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const transaction = MOCK_TRANSACTIONS.find((t) => String(t.id) === id);
    if (transaction) {
      transaction.transactionStatus = data.status;
      if (data.fulfillmentMethod) {
        transaction.fulfillmentMethod = data.fulfillmentMethod;
      }
    }
    return transaction ?? MOCK_TRANSACTIONS[0];
  }
  const response = await apiClient.put(`/transactions/${id}/status`, {
    transactionStatus: data.status,
    fulfillmentMethod: data.fulfillmentMethod,
  });
  return response.data.data as Transaction;
};

// ─── Payments (Buyer) ────────────────────────────────────────────────────────

export const getTransactions = async (): Promise<TransactionResponse[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PURCHASE_REQUESTS.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'COMPLETED'
    ).map((r) => ({
      id: r.id,
      purchaseRequestId: r.id,
      listingId: r.listingId,
      listingProductName: r.listingProductName,
      quantity: r.requestedQuantity,
      paymentStatus: r.status === 'COMPLETED' ? 'SUCCESS' : 'PENDING',
      transactionStatus:
        r.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING_FULFILLMENT',
      otpCode: null,
      completedAt: r.status === 'COMPLETED' ? r.updatedAt : null,
      createdAt: r.createdAt ?? new Date().toISOString(),
    }));
  }
  const response = await apiClient.get('/transactions');
  return response.data.data as TransactionResponse[];
};

export const initiatePayment = async (
  transactionId: number
): Promise<InitiatePaymentResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      transactionId,
      paymentReference: `mock-ref-${Date.now()}`,
      authorizationUrl: 'https://example.com/mock-checkout',
      paymentStatus: 'PENDING_PAYMENT',
      message: 'Payment initiated',
    };
  }
  const response = await apiClient.post('/payments/initiate', {
    transactionId,
  });
  return response.data.data as InitiatePaymentResponse;
};

export const verifyPayment = async (
  reference: string
): Promise<VerifyPaymentResponse> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      transactionId: 0,
      paymentReference: reference,
      paymentStatus: 'PAYMENT_SUCCESSFUL',
      message: 'Payment verified',
    };
  }
  const response = await apiClient.get(`/payments/verify/${reference}`);
  return response.data.data as VerifyPaymentResponse;
};