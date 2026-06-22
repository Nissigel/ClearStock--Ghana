package com.clearstock.backend.listings;

import com.clearstock.backend.listings.dto.CreateListingRequest;
import com.clearstock.backend.listings.dto.ListingResponse;
import com.clearstock.backend.listings.dto.UpdateListingRequest;
import com.clearstock.backend.seller.SellerProfile;
import com.clearstock.backend.seller.SellerRepository;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final SellerRepository sellerRepository;

    public ListingResponse createListing(User user, CreateListingRequest request) {
        SellerProfile seller = requireSellerProfile(user);

        Listing listing = Listing.builder()
                .seller(seller)
                .productName(request.getProductName())
                .category(request.getCategory())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .unitOfMeasurement(request.getUnitOfMeasurement())
                .originalPrice(request.getOriginalPrice())
                .currentPrice(request.getOriginalPrice())
                .expirySensitive(request.isExpirySensitive())
                .expiryDate(request.getExpiryDate())
                .clearanceEndDate(request.getClearanceEndDate())
                .discountStepPercent(request.getDiscountStepPercent())
                .discountIntervalDays(request.getDiscountIntervalDays())
                .minimumAcceptablePrice(request.getMinimumAcceptablePrice())
                .listingStatus(ListingStatus.ACTIVE)
                .images(request.getImages())
                .build();

        return mapToResponse(listingRepository.save(listing));
    }

    public List<ListingResponse> getAllActiveListings() {
        return listingRepository.findByListingStatus(ListingStatus.ACTIVE)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ListingResponse getListingById(Long id) {
        return mapToResponse(findListingOrThrow(id));
    }

    public ListingResponse updateListing(User user, Long id, UpdateListingRequest request) {
        SellerProfile seller = requireSellerProfile(user);
        Listing listing = findListingOrThrow(id);

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own listings");
        }
        if (listing.getListingStatus() == ListingStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot edit an archived listing");
        }

        if (request.getProductName() != null) listing.setProductName(request.getProductName());
        if (request.getCategory() != null) listing.setCategory(request.getCategory());
        if (request.getDescription() != null) listing.setDescription(request.getDescription());
        if (request.getQuantity() != null) listing.setQuantity(request.getQuantity());
        if (request.getUnitOfMeasurement() != null) listing.setUnitOfMeasurement(request.getUnitOfMeasurement());
        if (request.getExpirySensitive() != null) listing.setExpirySensitive(request.getExpirySensitive());
        if (request.getExpiryDate() != null) listing.setExpiryDate(request.getExpiryDate());
        if (request.getClearanceEndDate() != null) listing.setClearanceEndDate(request.getClearanceEndDate());
        if (request.getDiscountStepPercent() != null) listing.setDiscountStepPercent(request.getDiscountStepPercent());
        if (request.getDiscountIntervalDays() != null) listing.setDiscountIntervalDays(request.getDiscountIntervalDays());
        if (request.getImages() != null) listing.setImages(request.getImages());

        if (request.getListingStatus() != null && request.getListingStatus() != ListingStatus.ARCHIVED) {
            listing.setListingStatus(request.getListingStatus());
        }

        if (request.getMinimumAcceptablePrice() != null) {
            listing.setMinimumAcceptablePrice(request.getMinimumAcceptablePrice());
        }

        if (request.getCurrentPrice() != null) {
            if (listing.getMinimumAcceptablePrice() != null &&
                    request.getCurrentPrice().compareTo(listing.getMinimumAcceptablePrice()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Current price cannot go below minimum acceptable price of " +
                                listing.getMinimumAcceptablePrice());
            }
            listing.setCurrentPrice(request.getCurrentPrice());
        }

        return mapToResponse(listingRepository.save(listing));
    }

    public void archiveListing(User user, Long id) {
        SellerProfile seller = requireSellerProfile(user);
        Listing listing = findListingOrThrow(id);

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only archive your own listings");
        }

        // Active transaction check will be enforced in Block 3 (Orders module)
        listing.setListingStatus(ListingStatus.ARCHIVED);
        listingRepository.save(listing);
    }

    public List<ListingResponse> getSellerListings(User user) {
        SellerProfile seller = requireSellerProfile(user);
        return listingRepository.findBySeller(seller)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private SellerProfile requireSellerProfile(User user) {
        return sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "A seller profile is required to manage listings"));
    }

    private Listing findListingOrThrow(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
    }

    private ListingResponse mapToResponse(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .sellerId(listing.getSeller().getId())
                .sellerBusinessName(listing.getSeller().getBusinessName())
                .productName(listing.getProductName())
                .category(listing.getCategory())
                .description(listing.getDescription())
                .quantity(listing.getQuantity())
                .unitOfMeasurement(listing.getUnitOfMeasurement())
                .originalPrice(listing.getOriginalPrice())
                .currentPrice(listing.getCurrentPrice())
                .expirySensitive(listing.isExpirySensitive())
                .expiryDate(listing.getExpiryDate())
                .clearanceEndDate(listing.getClearanceEndDate())
                .discountStepPercent(listing.getDiscountStepPercent())
                .discountIntervalDays(listing.getDiscountIntervalDays())
                .minimumAcceptablePrice(listing.getMinimumAcceptablePrice())
                .listingStatus(listing.getListingStatus())
                .images(listing.getImages())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
