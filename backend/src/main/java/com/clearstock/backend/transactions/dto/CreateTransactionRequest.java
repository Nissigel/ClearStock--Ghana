package com.clearstock.backend.transactions.dto;

import com.clearstock.backend.transactions.FulfillmentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTransactionRequest {

    @NotNull(message = "Purchase request ID is required")
    private Long purchaseRequestId;

    @NotNull(message = "Fulfillment method is required")
    private FulfillmentMethod fulfillmentMethod;
}
