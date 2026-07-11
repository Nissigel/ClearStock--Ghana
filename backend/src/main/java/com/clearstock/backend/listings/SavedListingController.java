package com.clearstock.backend.listings;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.listings.dto.SavedListingResponse;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/saved-listings")
@RequiredArgsConstructor
public class SavedListingController {

    private final SavedListingService savedListingService;

    @PostMapping
    public ResponseEntity<ApiResponse<SavedListingResponse>> saveListing(
            Authentication authentication,
            @RequestParam Long listingId) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing saved", savedListingService.saveListing(user, listingId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedListingResponse>>> getSavedListings(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(savedListingService.getSavedListings(user)));
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<ApiResponse<Void>> removeSavedListing(
            Authentication authentication,
            @PathVariable Long listingId) {
        User user = (User) authentication.getPrincipal();
        savedListingService.removeSavedListing(user, listingId);
        return ResponseEntity.ok(ApiResponse.success("Listing removed from saved", null));
    }
}
