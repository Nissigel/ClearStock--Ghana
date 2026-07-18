package com.clearstock.backend.transactions.dto;

import com.clearstock.backend.transactions.FulfillmentMethod;
import com.clearstock.backend.transactions.PaymentStatus;
import com.clearstock.backend.transactions.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TransactionResponse {

    private Long id;
    private Long purchaseRequestId;
    private Long listingId;
    private String listingProductName;
    private Long buyerUserId;
    private Long sellerUserId;
    private Integer quantity;
    private FulfillmentMethod fulfillmentMethod;
    private PaymentStatus paymentStatus;
    private TransactionStatus transactionStatus;
    private String otpCode;
    private LocalDateTime otpGeneratedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /**
     * Whether the buyer has already reviewed this order, so the app stops
     * offering to rate a seller they've already rated.
     */
    private boolean reviewed;
    private List<EvidenceResponse> evidence;
}
