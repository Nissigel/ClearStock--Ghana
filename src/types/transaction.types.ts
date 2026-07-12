import type { PurchaseRequestStatus, TransactionStatus } from '@/constants/app';
import type { PaymentStatus } from '@/types/payment.types';

export interface PurchaseRequest {
  id: number;
  listingId: number;
  listingProductName: string;
  buyerUserId: number;
  sellerUserId: number;
  buyerPhone: string;
  sellerPhone: string;
  requestedQuantity: number;
  status: PurchaseRequestStatus;
  expiresAt: string | null;
  conversationId: string;
  createdAt: string | null;
  updatedAt: string;
}

export interface CreatePurchaseRequestRequest {
  listingId: number;
  requestedQuantity: number;
}

export interface ReviewRequestRequest {
  action: 'ACCEPT' | 'DECLINE';
}

// Matches the backend's GET /transactions and GET /transactions/{id}
// TransactionResponse exactly — there is no nested buyer/seller object or
// price field, only phone numbers and quantity.
export interface Transaction {
  id: number;
  purchaseRequestId: number;
  listingId: number;
  listingProductName: string;
  buyerUserId: number;
  sellerUserId: number;
  buyerPhone: string;
  sellerPhone: string;
  quantity: number;
  fulfillmentMethod: string;
  paymentStatus: PaymentStatus;
  transactionStatus: TransactionStatus;
  otpCode: string | null;
  otpGeneratedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: TransactionEvidence[];
}

export interface TransactionEvidence {
  id: number;
  imageUrl: string;
  uploadedByUserId: number;
  createdAt: string;
}

export interface UpdateTransactionStatusRequest {
  status: 'READY_FOR_COLLECTION' | 'DELIVERED' | 'CANCELLED';
  fulfillmentMethod?: FulfillmentMethod;
}

export interface VerifyTransactionOtpRequest {
  otp: string;
}

export type FulfillmentMethod = 'COLLECTION' | 'DELIVERY';

// Narrower view of the same GET /transactions response, used by the
// pay-now/verify-payment flow.
export interface TransactionResponse {
  id: number;
  purchaseRequestId: number;
  listingId: number;
  listingProductName: string;
  quantity: number;
  paymentStatus: string;
  transactionStatus: string;
  otpCode: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface InitiatePaymentResponse {
  transactionId: number;
  paymentReference: string;
  authorizationUrl: string;
  paymentStatus: PaymentStatus;
  message: string;
}

export interface VerifyPaymentResponse {
  transactionId: number;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  message: string;
}