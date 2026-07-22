import type { ListingSummary } from '@/types/listing.types';

/** Goods within this many days of their expiry date are running out of time. */
const EXPIRY_URGENT_DAYS = 21;
/** A clearance sale ending within this window is about to close. */
const CLEARANCE_URGENT_DAYS = 3;

const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/**
 * Whether a listing is genuinely running out — either the goods are close to
 * expiring, or the clearance sale is about to end.
 *
 * This is what earns a red price. Being discounted doesn't: on a clearance
 * marketplace nearly everything is, so colouring every discount red made red
 * mean nothing. The struck-through original price already says "reduced".
 */
export const isListingUrgent = (listing: {
  expiryDate?: string | null;
  clearanceEndDate?: string | null;
  listingStatus?: ListingSummary['listingStatus'];
}): boolean => {
  // A sold-out or archived listing isn't urgent, it's over.
  if (listing.listingStatus && listing.listingStatus !== 'ACTIVE') return false;

  const toExpiry = daysUntil(listing.expiryDate);
  if (toExpiry !== null && toExpiry >= 0 && toExpiry <= EXPIRY_URGENT_DAYS) {
    return true;
  }

  const toClearanceEnd = daysUntil(listing.clearanceEndDate);
  if (
    toClearanceEnd !== null &&
    toClearanceEnd >= 0 &&
    toClearanceEnd <= CLEARANCE_URGENT_DAYS
  ) {
    return true;
  }

  return false;
};
