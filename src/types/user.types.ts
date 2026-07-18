import type { VerificationStatus } from '@/constants/app';

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  profilePhotoUrl: string | null;
  region: string;
  cityTown: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  hasSellerProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  sellerType: string;
  businessName: string | null;
  marketHub: string;
  businessDescription: string;
  verificationStatus: VerificationStatus;
  ghanaCardNumber: string | null;
  ghanaCardPhotoUrl: string | null;
  businessRegUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithSellerProfile extends User {
  sellerProfile: SellerProfile | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  email?: string | null;
  profilePhotoUrl?: string | null;
  region?: string | null;
  cityTown?: string | null;
}

export interface UpdateSellerProfileRequest {
  businessName?: string | null;
  marketHub?: string;
  businessDescription?: string;
  ghanaCardNumber?: string | null;
  ghanaCardPhotoUrl?: string | null;
  businessRegUrl?: string | null;
}

export interface BecomeSellerRequest {
  sellerType: string;
  businessName?: string | null;
  marketHub: string;
  businessDescription: string;
  email?: string | null;
}

/**
 * A seller's money: held while a buyer's collection is unconfirmed, then
 * cleared once confirmed. ClearStock's commission is deducted before payout,
 * so every stage is reported gross and net.
 */
export interface SellerEarnings {
  /** Commission percentage ClearStock keeps, e.g. 7. */
  commissionRate: number;
  heldGross: number;
  heldNet: number;
  heldCount: number;
  clearedGross: number;
  clearedNet: number;
  clearedCount: number;
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  paidOut: number;
}

export interface RecoveryDashboard {
  totalGhsRecovered: number;
  totalTransactionsCompleted: number;
  goodsRescued: number;
  estimatedGhsSavedFromWaste: number;
  buyersReached: number;
  co2AvoidedKg: number;
}