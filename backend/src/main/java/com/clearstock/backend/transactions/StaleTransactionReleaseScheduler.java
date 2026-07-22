package com.clearstock.backend.transactions;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Once an order is marked ready/delivered the buyer has a fixed window to
 * confirm collection with the OTP. If they never do, the order is cancelled and
 * the item is put back on sale rather than being completed automatically.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StaleTransactionReleaseScheduler {

    private static final int CONFIRM_WINDOW_DAYS = 3;

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void releaseUnconfirmedTransactions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(CONFIRM_WINDOW_DAYS);

        List<Transaction> stale = transactionRepository
                .findByTransactionStatusInAndOtpGeneratedAtBefore(
                        List.of(TransactionStatus.READY_FOR_COLLECTION, TransactionStatus.DELIVERED),
                        cutoff);

        for (Transaction tx : stale) {
            log.info("Releasing transaction {} — buyer did not confirm OTP within {} days (OTP generated at {})",
                    tx.getId(), CONFIRM_WINDOW_DAYS, tx.getOtpGeneratedAt());
            transactionService.releaseUnconfirmedTransaction(tx);
        }
    }
}
