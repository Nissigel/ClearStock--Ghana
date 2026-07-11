export type PaymentMethod = 'MOMO' | 'CARD';
export type PaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';
export type MoMoNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export interface InitiatePaymentRequest {
  transactionId: string;
}

export interface PaymentResponse {
  transactionId: string;
  paymentReference: string;
  authorizationUrl: string;
  paymentStatus: PaymentStatus;
  message: string;
}