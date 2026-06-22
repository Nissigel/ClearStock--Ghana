package com.clearstock.backend.transactions.dto;

import com.clearstock.backend.transactions.PaymentStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {

    private Long transactionId;
    private String paymentReference;
    private PaymentStatus paymentStatus;
    private String message;
}
