package com.clearstock.backend.listings;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.listings.dto.CreateListingRequest;
import com.clearstock.backend.listings.dto.ListingResponse;
import com.clearstock.backend.listings.dto.UpdateListingRequest;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @PostMapping("/listings")
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            Authentication authentication,
            @RequestBody @Valid CreateListingRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing created", listingService.createListing(user, request)));
    }

    @GetMapping("/listings")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> getAllListings() {
        return ResponseEntity.ok(ApiResponse.success(listingService.getAllActiveListings()));
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
}
