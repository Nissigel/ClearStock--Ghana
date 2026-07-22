package com.clearstock.backend.listings.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateDealAlertRequest {
    private String category;
    private BigDecimal maxPrice;
    private String keywords;
    private String location;
    private Boolean isActive;
}
