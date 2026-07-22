package com.clearstock.backend.messaging.dto;

import com.clearstock.backend.messaging.ConversationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConversationResponse {

    private Long id;
    private Long listingId;
    private String listingProductName;
    private Long buyerUserId;
    private Long sellerUserId;
    private String buyerPhone;
    private String sellerPhone;
    private ConversationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
