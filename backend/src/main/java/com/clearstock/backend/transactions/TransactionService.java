package com.clearstock.backend.transactions;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.listings.ListingStatus;
import com.clearstock.backend.messaging.ConversationRepository;
import com.clearstock.backend.messaging.ConversationStatus;
import com.clearstock.backend.transactions.dto.*;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final int AUTO_COMPLETE_DAYS = 3;
    private final Random random = new Random();

    private final TransactionRepository transactionRepository;
    private final TransactionEvidenceRepository evidenceRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;

    @Transactional
    public TransactionResponse createTransaction(User seller, CreateTransactionRequest request) {
        PurchaseRequest pr = purchaseRequestRepository.findById(request.getPurchaseRequestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase request not found"));

        if (!pr.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only create transactions for your own purchase requests");
        }
        if (pr.getStatus() != PurchaseRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending purchase requests can be converted to transactions");
        }
        if (transactionRepository.findByPurchaseRequest(pr).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A transaction already exists for this purchase request");
        }

        pr.setStatus(PurchaseRequestStatus.ACCEPTED);
        purchaseRequestRepository.save(pr);

        Transaction transaction = Transaction.builder()
                .purchaseRequest(pr)
                .listing(pr.getListing())
                .buyer(pr.getBuyer())
                .seller(pr.getSeller())
                .quantity(pr.getRequestedQuantity())
                .fulfillmentMethod(request.getFulfillmentMethod())
                .build();

        return mapToResponse(transactionRepository.save(transaction));
    }

    public List<TransactionResponse> getTransactions(User user) {
        return transactionRepository.findByBuyerOrSellerOrderByCreatedAtDesc(user, user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public TransactionResponse getTransaction(User user, Long id) {
        return mapToResponse(findTransactionForParticipant(user, id));
    }

    @Transactional
    public PaymentResponse initiatePayment(User buyer, InitiatePaymentRequest request) {
        Transaction transaction = findTransactionForParticipant(buyer, request.getTransactionId());

        if (!transaction.getBuyer().getId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the buyer can initiate payment");
        }
        if (transaction.getPaymentStatus() != PaymentStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment has already been processed for this transaction");
        }

        String reference = "SIM-PAY-" + System.currentTimeMillis();
        transaction.setPaymentStatus(PaymentStatus.PAYMENT_SUCCESSFUL);
        transactionRepository.save(transaction);

        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .paymentReference(reference)
                .paymentStatus(PaymentStatus.PAYMENT_SUCCESSFUL)
                .message("Payment confirmed successfully (simulated)")
                .build();
    }

    @Transactional
    public PaymentResponse confirmWebhook(WebhookRequest request) {
        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (transaction.getPaymentStatus() == PaymentStatus.PAYMENT_SUCCESSFUL) {
            return PaymentResponse.builder()
                    .transactionId(transaction.getId())
                    .paymentReference(request.getReference())
                    .paymentStatus(PaymentStatus.PAYMENT_SUCCESSFUL)
                    .message("Payment already confirmed")
                    .build();
        }

        transaction.setPaymentStatus(PaymentStatus.PAYMENT_SUCCESSFUL);
        transactionRepository.save(transaction);

        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .paymentReference(request.getReference())
                .paymentStatus(PaymentStatus.PAYMENT_SUCCESSFUL)
                .message("Payment confirmed via webhook (simulated)")
                .build();
    }

    public PaymentResponse getPaymentStatus(User user, Long transactionId) {
        Transaction transaction = findTransactionForParticipant(user, transactionId);
        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .paymentReference(null)
                .paymentStatus(transaction.getPaymentStatus())
                .message("Payment status retrieved")
                .build();
    }

    @Transactional
    public TransactionResponse updateTransactionStatus(User seller, Long id, UpdateTransactionStatusRequest request) {
        Transaction transaction = findTransactionForParticipant(seller, id);

        if (!transaction.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seller can update transaction status");
        }
        if (transaction.getTransactionStatus() == TransactionStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed transactions cannot be modified");
        }

        TransactionStatus newStatus = request.getTransactionStatus();

        if (newStatus == TransactionStatus.READY_FOR_COLLECTION || newStatus == TransactionStatus.DELIVERED) {
            if (transaction.getPaymentStatus() != PaymentStatus.PAYMENT_SUCCESSFUL) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Payment must succeed before fulfillment can proceed");
            }
            String otp = String.format("%06d", random.nextInt(1_000_000));
            transaction.setOtpCode(otp);
            transaction.setOtpGeneratedAt(LocalDateTime.now());
        }

        if (newStatus == TransactionStatus.CANCELLED) {
            if (transaction.getTransactionStatus() == TransactionStatus.COMPLETED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed transaction");
            }
        }

        transaction.setTransactionStatus(newStatus);
        return mapToResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse verifyOtp(User buyer, Long id, VerifyOtpRequest request) {
        Transaction transaction = findTransactionForParticipant(buyer, id);

        if (!transaction.getBuyer().getId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the buyer can verify the OTP");
        }
        if (transaction.getTransactionStatus() != TransactionStatus.READY_FOR_COLLECTION
                && transaction.getTransactionStatus() != TransactionStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "OTP can only be verified when transaction is ready for collection or delivered");
        }
        if (transaction.getOtpCode() == null || !transaction.getOtpCode().equals(request.getOtpCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        transaction.setOtpCode(null);
        completeTransaction(transaction);

        return mapToResponse(transaction);
    }

    @Transactional
    public List<EvidenceResponse> uploadEvidence(User seller, Long id, UploadEvidenceRequest request) {
        Transaction transaction = findTransactionForParticipant(seller, id);

        if (!transaction.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seller can upload evidence");
        }
        if (transaction.getTransactionStatus() == TransactionStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot upload evidence for a cancelled transaction");
        }

        List<TransactionEvidence> saved = request.getImageUrls().stream()
                .map(url -> TransactionEvidence.builder()
                        .transaction(transaction)
                        .imageUrl(url)
                        .uploadedBy(seller)
                        .build())
                .map(evidenceRepository::save)
                .collect(Collectors.toList());

        return saved.stream().map(this::mapToEvidenceResponse).collect(Collectors.toList());
    }

    void completeTransaction(Transaction transaction) {
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        Listing listing = transaction.getListing();
        int remaining = listing.getQuantity() - transaction.getQuantity();
        listing.setQuantity(Math.max(remaining, 0));
        if (listing.getQuantity() == 0) {
            listing.setListingStatus(ListingStatus.OUT_OF_STOCK);
        }
        listingRepository.save(listing);

        conversationRepository.findByListingAndBuyerAndSeller(
                listing, transaction.getBuyer(), transaction.getSeller())
                .ifPresent(conv -> {
                    conv.setStatus(ConversationStatus.CLOSED);
                    conversationRepository.save(conv);
                });

        PurchaseRequest pr = transaction.getPurchaseRequest();
        pr.setStatus(PurchaseRequestStatus.COMPLETED);
        purchaseRequestRepository.save(pr);
    }

    private Transaction findTransactionForParticipant(User user, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
        boolean isParticipant = transaction.getBuyer().getId().equals(user.getId())
                || transaction.getSeller().getId().equals(user.getId());
        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return transaction;
    }

    private TransactionResponse mapToResponse(Transaction t) {
        List<EvidenceResponse> evidence = evidenceRepository
                .findByTransactionOrderByCreatedAtAsc(t)
                .stream().map(this::mapToEvidenceResponse).collect(Collectors.toList());

        return TransactionResponse.builder()
                .id(t.getId())
                .purchaseRequestId(t.getPurchaseRequest().getId())
                .listingId(t.getListing().getId())
                .listingProductName(t.getListing().getProductName())
                .buyerUserId(t.getBuyer().getId())
                .sellerUserId(t.getSeller().getId())
                .quantity(t.getQuantity())
                .fulfillmentMethod(t.getFulfillmentMethod())
                .paymentStatus(t.getPaymentStatus())
                .transactionStatus(t.getTransactionStatus())
                .otpCode(t.getOtpCode())
                .otpGeneratedAt(t.getOtpGeneratedAt())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .evidence(evidence)
                .build();
    }

    private EvidenceResponse mapToEvidenceResponse(TransactionEvidence e) {
        return EvidenceResponse.builder()
                .id(e.getId())
                .imageUrl(e.getImageUrl())
                .uploadedByUserId(e.getUploadedBy().getId())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
