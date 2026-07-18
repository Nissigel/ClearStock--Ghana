package com.clearstock.backend.seller.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * What a seller has earned, and where it currently sits.
 *
 * ClearStock holds a buyer's payment until the buyer confirms collection, and
 * takes a commission before the balance is released to the seller. Amounts are
 * reported both gross (what the buyer paid) and net (what the seller receives),
 * so the deduction is never a surprise.
 */
@Data
@Builder
public class SellerEarningsResponse {

    /** Commission ClearStock keeps, as a percentage — e.g. 7.00. */
    private BigDecimal commissionRate;

    // ── Paid by the buyer, but collection isn't confirmed yet ───────────────
    private BigDecimal heldGross;
    private BigDecimal heldNet;
    private long heldCount;

    // ── Collection confirmed, so this is owed to the seller ─────────────────
    private BigDecimal clearedGross;
    private BigDecimal clearedNet;
    private long clearedCount;

    // ── Totals across both stages ───────────────────────────────────────────
    private BigDecimal totalGross;
    private BigDecimal totalCommission;
    private BigDecimal totalNet;

    /** Actually settled to the seller. Payouts aren't automated yet, so 0. */
    private BigDecimal paidOut;
}
