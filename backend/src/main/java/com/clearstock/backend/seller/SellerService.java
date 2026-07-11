package com.clearstock.backend.seller;

import com.clearstock.backend.seller.dto.BecomeSellerRequest;
import com.clearstock.backend.seller.dto.RecoveryDashboardResponse;
import com.clearstock.backend.seller.dto.SellerProfileResponse;
import com.clearstock.backend.seller.dto.UpdateSellerProfileRequest;
import com.clearstock.backend.transactions.Transaction;
import com.clearstock.backend.transactions.ReviewRepository;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.transactions.TransactionStatus;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

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
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalCompletedTransactions(completedTx)
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
