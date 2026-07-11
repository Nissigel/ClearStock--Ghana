package com.clearstock.backend.transactions.dto;

import com.clearstock.backend.transactions.TransactionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTransactionStatusRequest {

    @NotNull(message = "Transaction status is required")
    private TransactionStatus transactionStatus;
}
