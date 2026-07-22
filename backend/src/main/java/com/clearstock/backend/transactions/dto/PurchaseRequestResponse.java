package com.clearstock.backend.transactions.dto;

import com.clearstock.backend.transactions.PurchaseRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PurchaseRequestResponse {

    private Long id;
    private Long listingId;
    private String listingProductName;
    private Long buyerUserId;
    private Long sellerUserId;
    private String buyerPhone;
    private String sellerPhone;
    private Integer requestedQuantity;
    private PurchaseRequestStatus status;
    private LocalDateTime expiresAt;
    private String conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
