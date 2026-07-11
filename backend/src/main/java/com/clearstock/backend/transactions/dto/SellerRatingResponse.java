package com.clearstock.backend.transactions.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SellerRatingResponse {

    private Long sellerId;
    private Double averageRating;
    private Long reviewCount;
    private Long totalCompletedTransactions;
}
