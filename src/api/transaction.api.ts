import ENV from '@/config/env';
import apiClient from '@/api/client';
import {
  MOCK_PURCHASE_REQUESTS,
  MOCK_TRANSACTIONS,
} from '@/mocks/transaction.mock';
import type {
  PurchaseRequest,
  Transaction,
  CreatePurchaseRequestRequest,
  ReviewRequestRequest,
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
      id: `request-${Date.now()}`,
      listingId: data.listingId,
      listingName: 'Indomie Instant Noodles',
      listingPrimaryImageUrl: 'https://via.placeholder.com/300x200',
      buyerUserId: 'user-001',
      sellerUserId: 'user-002',
      conversationId: 'conv-001',
      requestedQuantity: data.requestedQuantity,
      priceAtRequest: 45.00,
      status: 'PENDING',
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buyer: {
        id: 'user-001',
        fullName: 'Ama Mensah',
        profilePhotoUrl: null,
        phoneNumber: null,
      },
      seller: {
        id: 'user-002',
        fullName: 'Kofi Boateng',
        profilePhotoUrl: null,
        phoneNumber: null,
      },
    };
    MOCK_PURCHASE_REQUESTS.unshift(newRequest);
    return newRequest;
  }
  const response = await apiClient.post('/purchase-requests', data);
  return response.data.data as PurchaseRequest;
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
    const request = MOCK_PURCHASE_REQUESTS.find((r) => r.id === id);
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
    const request = MOCK_PURCHASE_REQUESTS.find((r) => r.id === id);
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
  const response = await apiClient.get('/seller/purchase-requests');
  return response.data.data as PurchaseRequest[];
};

export const reviewPurchaseRequest = async (
  id: string,
  data: ReviewRequestRequest
): Promise<PurchaseRequest> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const request = MOCK_PURCHASE_REQUESTS.find((r) => r.id === id);
    if (request) {
      request.status = data.action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    }
    return request ?? MOCK_PURCHASE_REQUESTS[0];
  }
  const response = await apiClient.post(
    `/seller/purchase-requests/${id}/${data.action.toLowerCase()}`,
    data
  );
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
    const transaction = MOCK_TRANSACTIONS.find((t) => t.id === id);
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
    const transaction = MOCK_TRANSACTIONS.find((t) => t.id === id);
    if (transaction) {
      transaction.status = 'COMPLETED';
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
  const response = await apiClient.get('/seller/transactions');
  return response.data.data as Transaction[];
};

export const updateTransactionStatus = async (
  id: string,
  data: UpdateTransactionStatusRequest
): Promise<Transaction> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const transaction = MOCK_TRANSACTIONS.find((t) => t.id === id);
    if (transaction) {
      transaction.status = data.status;
      if (data.fulfillmentMethod) {
        transaction.fulfillmentMethod = data.fulfillmentMethod;
      }
    }
    return transaction ?? MOCK_TRANSACTIONS[0];
  }
  const response = await apiClient.put(
    `/seller/transactions/${id}/status`,
    data
  );
  return response.data.data as Transaction;
};