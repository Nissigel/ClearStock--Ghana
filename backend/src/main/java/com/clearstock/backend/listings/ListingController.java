package com.clearstock.backend.listings;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.listings.dto.CreateListingRequest;
import com.clearstock.backend.listings.dto.ListingResponse;
import com.clearstock.backend.listings.dto.UpdateListingRequest;
import com.clearstock.backend.seller.VerificationStatus;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    private final UrgencyScoreScheduler urgencyScoreScheduler;

    @PostMapping("/listings")
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            Authentication authentication,
            @RequestBody @Valid CreateListingRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing created", listingService.createListing(user, request)));
    }

    @GetMapping("/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getAllListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String cityTown,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) VerificationStatus verificationStatus) {
        return ResponseEntity.ok(ApiResponse.success(
                listingService.searchListings(search, category, region, cityTown, minPrice, maxPrice, verificationStatus)));
    }

    @GetMapping("/listings/urgent")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getUrgentListings() {
        return ResponseEntity.ok(ApiResponse.success(listingService.getHighUrgencyListings()));
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> getListing(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(listingService.getListingById(id)));
    }

    @PutMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid UpdateListingRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Listing updated", listingService.updateListing(user, id, request)));
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<Void>> archiveListing(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        listingService.archiveListing(user, id);
        return ResponseEntity.ok(ApiResponse.success("Listing archived", null));
    }

    @GetMapping("/seller/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getSellerListings(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(listingService.getSellerListings(user)));
    }

    @PostMapping("/listings/recalculate-urgency")
    public ResponseEntity<ApiResponse<Void>> recalculateUrgency() {
        urgencyScoreScheduler.calculateNow();
        return ResponseEntity.ok(ApiResponse.success("Urgency scores recalculated", null));
    }
}
