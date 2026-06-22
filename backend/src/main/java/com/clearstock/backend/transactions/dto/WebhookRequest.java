package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WebhookRequest {

    @NotNull(message = "Transaction ID is required")
    private Long transactionId;

    private String reference;
}
