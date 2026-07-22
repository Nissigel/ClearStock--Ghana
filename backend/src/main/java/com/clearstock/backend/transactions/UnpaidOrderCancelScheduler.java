package com.clearstock.backend.transactions;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stock is reserved the moment a seller accepts an order, so an accepted order
 * the buyer never pays for would keep that stock locked. This sweep cancels
 * such orders after a fixed window and returns the stock to the listing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UnpaidOrderCancelScheduler {

    private static final int PAYMENT_WINDOW_HOURS = 24;

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Scheduled(cron = "0 0 */6 * * *")
    @Transactional
    public void cancelUnpaidOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(PAYMENT_WINDOW_HOURS);

        List<Transaction> unpaid = transactionRepository
                .findByTransactionStatusAndPaymentStatusInAndCreatedAtBefore(
                        TransactionStatus.PENDING_FULFILLMENT,
                        List.of(PaymentStatus.PENDING_PAYMENT, PaymentStatus.PAYMENT_FAILED),
                        cutoff);

        for (Transaction tx : unpaid) {
            log.info("Cancelling unpaid order {} — accepted at {} but not paid within {} hours",
                    tx.getId(), tx.getCreatedAt(), PAYMENT_WINDOW_HOURS);
            transactionService.cancelUnpaidOrder(tx);
        }
    }
}
