package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePurchaseRequestRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @NotNull(message = "Requested quantity is required")
    @Min(value = 1, message = "Requested quantity must be at least 1")
    private Integer requestedQuantity;
}
