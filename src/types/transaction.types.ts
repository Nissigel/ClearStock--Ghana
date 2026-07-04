import type { PurchaseRequestStatus, TransactionStatus } from '@/constants/app';

export interface PurchaseRequest {
  id: string;
  listingId: string;
  listingName: string;
  listingPrimaryImageUrl: string | null;
  buyerUserId: string;
  sellerUserId: string;
  conversationId: string;
  requestedQuantity: number;
  priceAtRequest: number;
  status: PurchaseRequestStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  buyer: RequestParty;
  seller: RequestParty;
}

export interface RequestParty {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  phoneNumber: string | null;
}

export interface CreatePurchaseRequestRequest {
  listingId: string;
  requestedQuantity: number;
}

export interface ReviewRequestRequest {
  action: 'ACCEPT' | 'DECLINE';
}

export interface Transaction {
  id: string;
  purchaseRequestId: string;
  listingId: string;
  listingName: string;
  listingPrimaryImageUrl: string | null;
  buyerUserId: string;
  sellerUserId: string;
  quantity: number;
  priceAtCreation: number;
  fulfillmentMethod: FulfillmentMethod | null;
  status: TransactionStatus;
  otpGeneratedAt: string | null;
  otpUsedAt: string | null;
  autoCompleteAfter: string | null;
  completedAt: string | null;
  evidenceImages: TransactionEvidence[];
  buyer: RequestParty;
  seller: RequestParty;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEvidence {
  id: string;
  transactionId: string;
  imageUrl: string;
  uploadedBy: string;
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