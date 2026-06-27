package com.clearstock.backend.transactions;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByBuyerOrSellerOrderByCreatedAtDesc(User buyer, User seller);

    Optional<Transaction> findByPurchaseRequest(PurchaseRequest purchaseRequest);

    List<Transaction> findByTransactionStatusInAndOtpGeneratedAtBefore(
            List<TransactionStatus> statuses, LocalDateTime cutoff);

    long countBySellerIdAndTransactionStatus(Long sellerId, TransactionStatus transactionStatus);
}
