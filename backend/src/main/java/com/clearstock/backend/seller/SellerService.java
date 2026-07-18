package com.clearstock.backend.seller;

import com.clearstock.backend.seller.dto.BecomeSellerRequest;
import com.clearstock.backend.seller.dto.RecoveryDashboardResponse;
import com.clearstock.backend.seller.dto.SellerEarningsResponse;
import com.clearstock.backend.seller.dto.SellerProfileResponse;
import com.clearstock.backend.seller.dto.SubmitVerificationRequest;
import com.clearstock.backend.seller.dto.UpdateSellerProfileRequest;
import com.clearstock.backend.transactions.Transaction;
import com.clearstock.backend.transactions.ReviewRepository;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.transactions.PaymentStatus;
import com.clearstock.backend.transactions.TransactionStatus;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

    /** ClearStock keeps 7% of each sale, deducted before the seller is paid. */
    private static final BigDecimal COMMISSION_RATE_PERCENT = new BigDecimal("7.00");

    private final SellerRepository sellerRepository;
    private final ReviewRepository reviewRepository;
    private final TransactionRepository transactionRepository;

    public SellerProfileResponse becomeSeller(User user, BecomeSellerRequest request) {
        try {
            if (sellerRepository.existsByUser(user)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Seller profile already exists");
            }

            SellerProfile profile = SellerProfile.builder()
                    .user(user)
                    .businessName(request.getBusinessName())
                    .businessDescription(request.getBusinessDescription())
                    .businessLocation(request.getBusinessLocation())
                    .businessPhone(request.getBusinessPhone())
                    .businessCategory(request.getBusinessCategory())
                    .marketHub(request.getMarketHub())
                    .sellerType(request.getSellerType())
                    .verificationStatus(VerificationStatus.UNVERIFIED)
                    .build();

            return mapToResponse(sellerRepository.save(profile));
        } catch (Exception e) {
            log.error("becomeSeller failed for userId={}", user.getId(), e);
            throw e;
        }
    }

    public SellerProfileResponse getSellerProfile(User user) {
        SellerProfile profile = sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No seller profile found"));
        return mapToResponse(profile);
    }

    public SellerProfileResponse updateSellerProfile(User user, UpdateSellerProfileRequest request) {
        SellerProfile profile = sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No seller profile found"));

        if (request.getBusinessName() != null) profile.setBusinessName(request.getBusinessName());
        if (request.getBusinessDescription() != null) profile.setBusinessDescription(request.getBusinessDescription());
        if (request.getBusinessLocation() != null) profile.setBusinessLocation(request.getBusinessLocation());
        if (request.getBusinessPhone() != null) profile.setBusinessPhone(request.getBusinessPhone());
        if (request.getBusinessCategory() != null) profile.setBusinessCategory(request.getBusinessCategory());
        if (request.getMarketHub() != null) profile.setMarketHub(request.getMarketHub());

        return mapToResponse(sellerRepository.save(profile));
    }

    /**
     * Submit identity and business documents for review.
     *
     * Sellers can trade before verifying, so this is available at any point
     * after the profile exists. Submitting moves them to PENDING and clears any
     * previous rejection reason, so a resubmission starts clean.
     */
    public SellerProfileResponse submitVerification(
            User user, SubmitVerificationRequest request) {
        SellerProfile profile = sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No seller profile found"));

        if (profile.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This shop is already verified");
        }

        profile.setGhanaCardNumber(request.getGhanaCardNumber().strip());
        profile.setGhanaCardPhotoUrl(request.getGhanaCardPhotoUrl());
        if (request.getBusinessRegUrl() != null) {
            profile.setBusinessRegUrl(request.getBusinessRegUrl());
        }
        profile.setVerificationStatus(VerificationStatus.PENDING);
        profile.setRejectionReason(null);
        profile.setDocumentsSubmittedAt(LocalDateTime.now());

        return mapToResponse(sellerRepository.save(profile));
    }

    /**
     * Where a seller's money currently sits. A buyer's payment is held until
     * they confirm collection, so it clears in two stages.
     */
    public SellerEarningsResponse getEarnings(User user) {
        List<Transaction> all = transactionRepository
                .findByBuyerOrSellerOrderByCreatedAtDesc(user, user)
                .stream()
                .filter(t -> t.getSeller() != null && t.getSeller().getId().equals(user.getId()))
                .toList();

        // Only money the buyer has actually paid counts towards either bucket.
        List<Transaction> paid = all.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatus.PAYMENT_SUCCESSFUL)
                .toList();

        List<Transaction> cleared = paid.stream()
                .filter(t -> t.getTransactionStatus() == TransactionStatus.COMPLETED)
                .toList();

        List<Transaction> held = paid.stream()
                .filter(t -> t.getTransactionStatus() != TransactionStatus.COMPLETED
                        && t.getTransactionStatus() != TransactionStatus.CANCELLED)
                .toList();

        BigDecimal heldGross = sumOf(held);
        BigDecimal clearedGross = sumOf(cleared);
        BigDecimal totalGross = heldGross.add(clearedGross).setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCommission = commissionOn(totalGross);

        return SellerEarningsResponse.builder()
                .commissionRate(COMMISSION_RATE_PERCENT)
                .heldGross(heldGross)
                .heldNet(heldGross.subtract(commissionOn(heldGross)).setScale(2, RoundingMode.HALF_UP))
                .heldCount(held.size())
                .clearedGross(clearedGross)
                .clearedNet(clearedGross.subtract(commissionOn(clearedGross)).setScale(2, RoundingMode.HALF_UP))
                .clearedCount(cleared.size())
                .totalGross(totalGross)
                .totalCommission(totalCommission)
                .totalNet(totalGross.subtract(totalCommission).setScale(2, RoundingMode.HALF_UP))
                // Payouts aren't automated yet — sellers are settled manually.
                .paidOut(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    /** ClearStock's cut of a sale, deducted before the seller is paid. */
    private BigDecimal commissionOn(BigDecimal gross) {
        return gross.multiply(COMMISSION_RATE_PERCENT)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /** Transactions don't store an amount, so derive it the same way the
     *  recovery dashboard does: unit price times quantity. */
    private BigDecimal sumOf(List<Transaction> transactions) {
        return transactions.stream()
                .map(t -> t.getListing().getCurrentPrice()
                        .multiply(BigDecimal.valueOf(t.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public RecoveryDashboardResponse getRecoveryDashboard(User user) {
        List<Transaction> completed = transactionRepository
                .findBySellerIdAndTransactionStatus(user.getId(), TransactionStatus.COMPLETED);

        BigDecimal totalGhsRecovered = completed.stream()
                .map(t -> t.getListing().getCurrentPrice()
                        .multiply(BigDecimal.valueOf(t.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long goodsRescued = completed.stream()
                .map(t -> t.getListing().getId())
                .distinct()
                .count();

        BigDecimal estimatedGhsSavedFromWaste = totalGhsRecovered
                .multiply(new BigDecimal("0.4"))
                .setScale(2, RoundingMode.HALF_UP);

        return RecoveryDashboardResponse.builder()
                .totalGhsRecovered(totalGhsRecovered)
                .totalTransactionsCompleted(completed.size())
                .goodsRescued(goodsRescued)
                .estimatedGhsSavedFromWaste(estimatedGhsSavedFromWaste)
                .build();
    }

    private SellerProfileResponse mapToResponse(SellerProfile profile) {
        Long userId = profile.getUser().getId();
        Double avg = reviewRepository.findAverageRatingByRevieweeId(userId);
        long completedTx = transactionRepository.countBySellerIdAndTransactionStatus(
                userId, TransactionStatus.COMPLETED);

        return SellerProfileResponse.builder()
                .id(profile.getId())
                .userId(userId)
                .businessName(profile.getBusinessName())
                .businessDescription(profile.getBusinessDescription())
                .businessLocation(profile.getBusinessLocation())
                .businessPhone(profile.getBusinessPhone())
                .businessCategory(profile.getBusinessCategory())
                .marketHub(profile.getMarketHub())
                .verificationStatus(profile.getVerificationStatus())
                // The photo lives on the user account rather than the seller
                // profile, so without this buyers only ever saw initials.
                .profileImageUrl(profile.getUser().getProfileImageUrl())
                .ghanaCardNumber(profile.getGhanaCardNumber())
                .ghanaCardPhotoUrl(profile.getGhanaCardPhotoUrl())
                .businessRegUrl(profile.getBusinessRegUrl())
                .rejectionReason(profile.getRejectionReason())
                .documentsSubmittedAt(profile.getDocumentsSubmittedAt())
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalCompletedTransactions(completedTx)
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
