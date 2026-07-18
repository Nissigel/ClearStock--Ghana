package com.clearstock.backend.admin.dto;

import com.clearstock.backend.transactions.PaymentStatus;
import com.clearstock.backend.transactions.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One payment, and where the money currently sits. */
@Data
@Builder
public class AdminTransactionResponse {
    private Long id;
    private String listingTitle;
    private String buyerName;
    private String sellerName;
    private Integer quantity;
    private BigDecimal amount;
    private BigDecimal commission;
    private BigDecimal netToSeller;
    private PaymentStatus paymentStatus;
    private TransactionStatus transactionStatus;
    /**
     * HELD while the buyer has paid but not confirmed collection, RELEASED
     * once the transaction completes, UNPAID before payment, CANCELLED if it
     * fell through. This is the escrow position in one word.
     */
    private String escrowState;
    private String paymentReference;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
