package com.clearstock.backend.transactions;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionAutoCompleteScheduler {

    private static final int AUTO_COMPLETE_DAYS = 3;

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void autoCompleteStaleTransactions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(AUTO_COMPLETE_DAYS);

        List<Transaction> stale = transactionRepository
                .findByTransactionStatusInAndOtpGeneratedAtBefore(
                        List.of(TransactionStatus.READY_FOR_COLLECTION, TransactionStatus.DELIVERED),
                        cutoff);

        for (Transaction tx : stale) {
            log.info("Auto-completing transaction {} — OTP generated at {} has passed {} day threshold",
                    tx.getId(), tx.getOtpGeneratedAt(), AUTO_COMPLETE_DAYS);
            transactionService.completeTransaction(tx);
        }
    }
}
