package com.clearstock.backend.listings.dto;

import com.clearstock.backend.listings.ListingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ListingResponse {

    private Long id;
    private Long sellerId;
    private String sellerBusinessName;
    private String productName;
    private String category;
    private String description;
    private Integer quantity;
    private String unitOfMeasurement;
    private BigDecimal originalPrice;
    private BigDecimal currentPrice;
    private boolean expirySensitive;
    private LocalDate expiryDate;
    private LocalDate clearanceEndDate;
    private BigDecimal discountStepPercent;
    private Integer discountIntervalDays;
    private BigDecimal minimumAcceptablePrice;
    private ListingStatus listingStatus;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
