package com.clearstock.backend.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BecomeSellerRequest {

    @NotBlank(message = "Business name is required")
    private String businessName;

    private String businessDescription;

    private String businessLocation;

    private String businessPhone;

    private String businessCategory;
}
