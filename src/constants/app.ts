export const APP_NAME = 'ClearStock Ghana';
export const APP_VERSION = '1.0.0';

export const CURRENCY = 'GHS';
export const CURRENCY_SYMBOL = 'GHS';

export const MAX_LISTING_IMAGES = 5;
export const MIN_LISTING_IMAGES = 1;
export const MAX_MESSAGE_LENGTH = 500;
export const MIN_PURCHASE_QUANTITY = 1;
export const PURCHASE_REQUEST_EXPIRY_DAYS = 7;
export const TRANSACTION_AUTO_COMPLETE_DAYS = 3;
export const OTP_LENGTH = 6;
export const PIN_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  FIRST_PAGE: 0,
} as const;

export const LISTING_STATUS = {
  ACTIVE: 'ACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export const PURCHASE_REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

export const TRANSACTION_STATUS = {
  PENDING_FULFILLMENT: 'PENDING_FULFILLMENT',
  READY_FOR_COLLECTION: 'READY_FOR_COLLECTION',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const NOTIFICATION_CATEGORY = {
  MESSAGING: 'MESSAGING',
  PURCHASE_REQUEST: 'PURCHASE_REQUEST',
  LISTING: 'LISTING',
  TRANSACTION: 'TRANSACTION',
} as const;

export const USER_MODE = {
  BUYER: 'buyer',
  SELLER: 'seller',
} as const;

export type ListingStatus = keyof typeof LISTING_STATUS;
export type VerificationStatus = keyof typeof VERIFICATION_STATUS;
export type PurchaseRequestStatus = keyof typeof PURCHASE_REQUEST_STATUS;
export type TransactionStatus = keyof typeof TRANSACTION_STATUS;
export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORY;
export type UserMode = typeof USER_MODE[keyof typeof USER_MODE];