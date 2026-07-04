export type PaymentMethod = 'MOMO' | 'CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type MoMoNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export interface InitiatePaymentRequest {
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
  momoNetwork?: MoMoNetwork;
  email?: string;
}

export interface PaymentResponse {
  id: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  reference: string;
  createdAt: string;
}