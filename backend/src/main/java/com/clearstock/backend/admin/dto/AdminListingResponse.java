package com.clearstock.backend.admin.dto;

import com.clearstock.backend.listings.ListingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminListingResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String sellerName;
    private Long sellerUserId;
    private BigDecimal originalPrice;
    private BigDecimal currentPrice;
    private Integer quantity;
    private String unit;
    private ListingStatus listingStatus;
    private LocalDate expiryDate;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
}
