package com.clearstock.backend.seller;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.seller.dto.BecomeSellerRequest;
import com.clearstock.backend.seller.dto.SellerProfileResponse;
import com.clearstock.backend.seller.dto.UpdateSellerProfileRequest;
import com.clearstock.backend.transactions.ReviewService;
import com.clearstock.backend.transactions.dto.SellerRatingResponse;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/seller")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;
    private final ReviewService reviewService;

    @PostMapping("/become")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> becomeSeller(
            Authentication authentication,
            @RequestBody @Valid BecomeSellerRequest request) {
        User user = (User) authentication.getPrincipal();
        SellerProfileResponse profile = sellerService.becomeSeller(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Seller profile created", profile));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getSellerProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(sellerService.getSellerProfile(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> updateSellerProfile(
            Authentication authentication,
            @RequestBody @Valid UpdateSellerProfileRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Seller profile updated", sellerService.updateSellerProfile(user, request)));
    }

    @GetMapping("/{sellerId}/rating")
    public ResponseEntity<ApiResponse<SellerRatingResponse>> getSellerRating(
            @PathVariable Long sellerId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getSellerRating(sellerId)));
    }
}
