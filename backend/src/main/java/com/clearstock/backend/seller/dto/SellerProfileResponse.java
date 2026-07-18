package com.clearstock.backend.seller.dto;

import com.clearstock.backend.seller.VerificationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SellerProfileResponse {

    private Long id;
    private Long userId;
    private String businessName;
    private String businessDescription;
    private String businessLocation;
    private String businessPhone;
    private String businessCategory;
    private String marketHub;
    private VerificationStatus verificationStatus;
    /** The seller's photo, carried over from their user account. */
    private String profileImageUrl;
    private Double averageRating;
    private Long totalCompletedTransactions;
    private LocalDateTime createdAt;
}
