package com.clearstock.backend.listings.dto;

import com.clearstock.backend.listings.DealAlert;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class DealAlertResponse {

    private Long id;
    private Long buyerId;
    private String category;
    private BigDecimal maxPrice;
    private String keywords;
    private String location;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static DealAlertResponse from(DealAlert alert) {
        return DealAlertResponse.builder()
                .id(alert.getId())
                .buyerId(alert.getBuyer().getId())
                .category(alert.getCategory())
                .maxPrice(alert.getMaxPrice())
                .keywords(alert.getKeywords())
                .location(alert.getLocation())
                .isActive(alert.getIsActive())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
