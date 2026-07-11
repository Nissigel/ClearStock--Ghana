package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InitiatePaymentRequest {

    @NotNull(message = "Transaction ID is required")
    private Long transactionId;
}
