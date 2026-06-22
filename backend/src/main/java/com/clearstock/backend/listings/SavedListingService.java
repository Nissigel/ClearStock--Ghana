package com.clearstock.backend.listings;

import com.clearstock.backend.listings.dto.ListingResponse;
import com.clearstock.backend.listings.dto.SavedListingResponse;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedListingService {

    private final SavedListingRepository savedListingRepository;
    private final ListingRepository listingRepository;

    public SavedListingResponse saveListing(User user, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (listing.getListingStatus() != ListingStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active listings can be saved");
        }
        if (savedListingRepository.existsByUserAndListing(user, listing)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Listing already saved");
        }

        SavedListing saved = SavedListing.builder()
                .user(user)
                .listing(listing)
                .build();

        return mapToResponse(savedListingRepository.save(saved));
    }

    public List<SavedListingResponse> getSavedListings(User user) {
        return savedListingRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public void removeSavedListing(User user, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        SavedListing saved = savedListingRepository.findByUserAndListing(user, listing)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved listing not found"));

        savedListingRepository.delete(saved);
    }

    private SavedListingResponse mapToResponse(SavedListing savedListing) {
        return SavedListingResponse.builder()
                .id(savedListing.getId())
                .listing(ListingResponse.from(savedListing.getListing()))
                .savedAt(savedListing.getCreatedAt())
                .build();
    }
}
