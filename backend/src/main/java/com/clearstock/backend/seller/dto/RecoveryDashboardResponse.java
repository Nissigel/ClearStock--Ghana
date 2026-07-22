package com.clearstock.backend.seller.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RecoveryDashboardResponse {
    private BigDecimal totalGhsRecovered;
    private long totalTransactionsCompleted;
    private long goodsRescued;
    private BigDecimal estimatedGhsSavedFromWaste;
    private long buyersReached;
    private BigDecimal co2AvoidedKg;
}
