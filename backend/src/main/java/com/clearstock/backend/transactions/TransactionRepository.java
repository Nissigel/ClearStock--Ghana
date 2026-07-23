package com.clearstock.backend.transactions;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByBuyerOrSellerOrderByCreatedAtDesc(User buyer, User seller);

    List<Transaction> findAllByOrderByCreatedAtDesc();

    Optional<Transaction> findByPurchaseRequest(PurchaseRequest purchaseRequest);

    Optional<Transaction> findByPaymentReference(String paymentReference);

    List<Transaction> findByTransactionStatusInAndOtpGeneratedAtBefore(
            List<TransactionStatus> statuses, LocalDateTime cutoff);

    List<Transaction> findByTransactionStatusAndPaymentStatusInAndCreatedAtBefore(
            TransactionStatus transactionStatus, List<PaymentStatus> paymentStatuses,
            LocalDateTime cutoff);

    long countBySellerIdAndTransactionStatus(Long sellerId, TransactionStatus transactionStatus);

    List<Transaction> findBySellerIdAndTransactionStatus(Long sellerId, TransactionStatus transactionStatus);

    boolean existsByListing(Listing listing);

    /**
     * Whether this buyer/seller pair have a transaction in the given state on a
     * listing. Used to tell when a deal is finished, so the conversation can be
     * closed and the contact numbers hidden again.
     */
    boolean existsByListingAndBuyerAndSellerAndTransactionStatus(
            Listing listing, User buyer, User seller, TransactionStatus transactionStatus);
}
