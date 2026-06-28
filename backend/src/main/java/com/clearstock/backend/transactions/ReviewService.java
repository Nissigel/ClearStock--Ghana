package com.clearstock.backend.transactions;

import com.clearstock.backend.notifications.NotificationService;
import com.clearstock.backend.notifications.NotificationType;
import com.clearstock.backend.transactions.dto.ReviewResponse;
import com.clearstock.backend.transactions.dto.SellerRatingResponse;
import com.clearstock.backend.transactions.dto.SubmitReviewRequest;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public ReviewResponse submitReview(User reviewer, SubmitReviewRequest request) {
        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (transaction.getTransactionStatus() != TransactionStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Reviews can only be submitted for completed transactions");
        }

        boolean isBuyer = transaction.getBuyer().getId().equals(reviewer.getId());
        boolean isSeller = transaction.getSeller().getId().equals(reviewer.getId());

        if (!isBuyer && !isSeller) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not a party to this transaction");
        }

        Long expectedRevieweeId = isBuyer
                ? transaction.getSeller().getId()
                : transaction.getBuyer().getId();

        if (!request.getRevieweeId().equals(expectedRevieweeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Reviewee must be the other party in this transaction");
        }

        if (reviewRepository.existsByTransactionAndReviewer(transaction, reviewer)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have already reviewed this transaction");
        }

        User reviewee = isBuyer ? transaction.getSeller() : transaction.getBuyer();

        Review review = Review.builder()
                .transaction(transaction)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        notificationService.send(
                reviewee,
                "New Review Received",
                reviewer.getName() + " gave you a " + request.getRating()
                        + "-star review for " + transaction.getListing().getProductName() + ".",
                NotificationType.REVIEW,
                saved.getId()
        );

        return mapToResponse(saved);
    }

    public List<ReviewResponse> getReviewsForUser(Long userId) {
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public SellerRatingResponse getSellerRating(Long sellerId) {
        Double avg = reviewRepository.findAverageRatingByRevieweeId(sellerId);
        long reviewCount = reviewRepository.countByRevieweeId(sellerId);
        long completedTx = transactionRepository.countBySellerIdAndTransactionStatus(
                sellerId, TransactionStatus.COMPLETED);

        return SellerRatingResponse.builder()
                .sellerId(sellerId)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .reviewCount(reviewCount)
                .totalCompletedTransactions(completedTx)
                .build();
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .transactionId(review.getTransaction().getId())
                .reviewerId(review.getReviewer().getId())
                .reviewerName(review.getReviewer().getName())
                .revieweeId(review.getReviewee().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
