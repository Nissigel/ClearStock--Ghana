package com.clearstock.backend.transactions;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.transactions.dto.ReviewResponse;
import com.clearstock.backend.transactions.dto.SubmitReviewRequest;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            Authentication authentication,
            @RequestBody @Valid SubmitReviewRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted", reviewService.submitReview(user, request)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsForUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewsForUser(userId)));
    }
}
