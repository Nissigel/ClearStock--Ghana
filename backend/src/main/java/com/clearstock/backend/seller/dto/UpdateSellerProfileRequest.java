package com.clearstock.backend.seller.dto;

import lombok.Data;

@Data
public class UpdateSellerProfileRequest {

    private String businessName;
    private String businessDescription;
    private String businessLocation;
    private String businessPhone;
    private String businessCategory;
}
