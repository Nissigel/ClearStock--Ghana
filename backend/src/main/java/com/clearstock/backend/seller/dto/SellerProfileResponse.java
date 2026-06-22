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
    private VerificationStatus verificationStatus;
    private LocalDateTime createdAt;
}
