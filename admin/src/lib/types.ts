export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type ListingStatus =
  | 'ACTIVE'
  | 'OUT_OF_STOCK'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'SUSPENDED';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  pendingVerifications: number;
  totalListings: number;
  activeListings: number;
  archivedListings: number;
  suspendedListings: number;
  openReports: number;
  purchaseRequests: number;
  completedTransactions: number;
}

export interface Verification {
  sellerProfileId: number;
  userId: number;
  sellerName: string;
  businessName: string | null;
  sellerType: string | null;
  region: string | null;
  cityTown: string | null;
  marketHub: string | null;
  businessDescription: string | null;
  ghanaCardNumber: string | null;
  ghanaCardPhotoUrl: string | null;
  businessRegUrl: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  documentsSubmittedAt: string | null;
}

export interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  region: string | null;
  cityTown: string | null;
  role: 'SELLER' | 'BUYER';
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface AdminListing {
  id: number;
  title: string;
  description: string | null;
  category: string;
  sellerName: string | null;
  sellerUserId: number | null;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  unit: string;
  listingStatus: ListingStatus;
  expiryDate: string | null;
  clearanceEndDate: string | null;
  minimumAcceptablePrice: number | null;
  expirySensitive: boolean | null;
  imageUrls: string[];
  createdAt: string;
}

export interface AdminReport {
  id: number;
  targetType: 'SELLER' | 'BUYER' | 'LISTING' | 'REVIEW';
  targetLabel: string;
  targetId: number | null;
  category: string;
  reporterName: string;
  status: ReportStatus;
  createdAt: string;
}

export type AuditAction =
  | 'APPROVED_VERIFICATION'
  | 'REJECTED_VERIFICATION'
  | 'SUSPENDED_USER'
  | 'REACTIVATED_USER'
  | 'SUSPENDED_LISTING'
  | 'RESTORED_LISTING'
  | 'ARCHIVED_LISTING'
  | 'ACTIONED_REPORT'
  | 'DISMISSED_REPORT'
  | 'CREATED_ADMIN'
  | 'DISABLED_ADMIN'
  | 'ENABLED_ADMIN'
  | 'CHANGED_ADMIN_ROLE';

export interface AuditLog {
  id: number;
  action: AuditAction;
  adminName: string;
  adminId: number;
  targetType: string;
  targetId: number | null;
  targetLabel: string | null;
  note: string | null;
  createdAt: string;
}

export type EscrowState = 'HELD' | 'RELEASED' | 'UNPAID' | 'CANCELLED';

export interface AdminTransaction {
  id: number;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  quantity: number;
  amount: number;
  commission: number;
  netToSeller: number;
  paymentStatus: string;
  transactionStatus: string;
  escrowState: EscrowState;
  paymentReference: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminPayments {
  commissionRate: number;
  heldTotal: number;
  heldCount: number;
  releasedTotal: number;
  releasedCount: number;
  grossTotal: number;
  commissionTotal: number;
  netToSellersTotal: number;
  transactions: AdminTransaction[];
}

export interface AdminReview {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  revieweeName: string;
  revieweeUserId: number;
  listingTitle: string;
  createdAt: string;
}
