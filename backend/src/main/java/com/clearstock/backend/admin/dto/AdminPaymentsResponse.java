package com.clearstock.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * The money view: what is sitting in escrow, what has been released to
 * sellers, and what ClearStock has earned in commission.
 */
@Data
@Builder
public class AdminPaymentsResponse {
    private BigDecimal commissionRate;
    private BigDecimal heldTotal;
    private int heldCount;
    private BigDecimal releasedTotal;
    private int releasedCount;
    private BigDecimal grossTotal;
    private BigDecimal commissionTotal;
    private BigDecimal netToSellersTotal;
    private List<AdminTransactionResponse> transactions;
}
