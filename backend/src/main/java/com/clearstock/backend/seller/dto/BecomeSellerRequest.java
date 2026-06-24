package com.clearstock.backend.seller.dto;

import com.clearstock.backend.seller.SellerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BecomeSellerRequest {

    @NotBlank(message = "Business name is required")
    private String businessName;

    @NotNull(message = "Seller type is required")
    private SellerType sellerType;

    private String businessDescription;

    private String businessLocation;

    private String businessPhone;

    private String businessCategory;

    private String marketHub;
}
