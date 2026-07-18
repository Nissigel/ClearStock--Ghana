package com.clearstock.backend.listings.dto;

import com.clearstock.backend.listings.Listing;
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
    /** The seller's photo, so buyers see a face rather than just initials. */
    private String sellerProfileImageUrl;
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
    private BigDecimal manualDiscountPercent;
    private BigDecimal minimumAcceptablePrice;
    private ListingStatus listingStatus;
    private Integer urgencyScore;
    private Boolean isHighUrgency;
    private boolean isDiscountActive;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ListingResponse from(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .sellerId(listing.getSeller().getId())
                .sellerBusinessName(listing.getSeller().getBusinessName())
                .sellerProfileImageUrl(
                        listing.getSeller().getUser() != null
                                ? listing.getSeller().getUser().getProfileImageUrl()
                                : null)
                .productName(listing.getProductName())
                .category(listing.getCategory())
                .description(listing.getDescription())
                .quantity(listing.getQuantity())
                .unitOfMeasurement(listing.getUnitOfMeasurement())
                .originalPrice(listing.getOriginalPrice())
                .currentPrice(listing.getCurrentPrice())
                .expirySensitive(listing.isExpirySensitive())
                .expiryDate(listing.getExpiryDate())
                .clearanceEndDate(listing.getClearanceEndDate())
                .discountStepPercent(listing.getDiscountStepPercent())
                .discountIntervalDays(listing.getDiscountIntervalDays())
                .manualDiscountPercent(listing.getManualDiscountPercent())
                .minimumAcceptablePrice(listing.getMinimumAcceptablePrice())
                .listingStatus(listing.getListingStatus())
                .urgencyScore(listing.getUrgencyScore())
                .isHighUrgency(listing.getIsHighUrgency())
                .isDiscountActive(listing.isDiscountActive())
                .images(listing.getImages())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
