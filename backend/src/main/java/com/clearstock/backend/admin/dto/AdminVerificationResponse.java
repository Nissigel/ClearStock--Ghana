package com.clearstock.backend.admin.dto;

import com.clearstock.backend.seller.VerificationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** One row of the verifications table, and the detail screen behind it. */
@Data
@Builder
public class AdminVerificationResponse {
    private Long sellerProfileId;
    private Long userId;
    private String sellerName;
    private String businessName;
    private String sellerType;
    private String region;
    private String cityTown;
    private String marketHub;
    private String businessDescription;
    private String ghanaCardNumber;
    private String ghanaCardPhotoUrl;
    private String businessRegUrl;
    private VerificationStatus verificationStatus;
    private String rejectionReason;
    private LocalDateTime documentsSubmittedAt;
}
