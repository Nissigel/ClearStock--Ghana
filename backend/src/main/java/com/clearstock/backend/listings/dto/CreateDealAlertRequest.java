package com.clearstock.backend.listings.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateDealAlertRequest {
    private String category;
    private BigDecimal maxPrice;
    private String keywords;
    private String location;
}
