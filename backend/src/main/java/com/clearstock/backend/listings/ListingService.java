package com.clearstock.backend.listings;

import com.clearstock.backend.listings.dto.CreateListingRequest;
import com.clearstock.backend.listings.dto.ListingResponse;
import com.clearstock.backend.listings.dto.UpdateListingRequest;
import com.clearstock.backend.seller.SellerProfile;
import com.clearstock.backend.seller.SellerRepository;
import com.clearstock.backend.seller.VerificationStatus;
import com.clearstock.backend.transactions.PurchaseRequestRepository;
import com.clearstock.backend.transactions.PurchaseRequestStatus;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final SellerRepository sellerRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final TransactionRepository transactionRepository;
    private final SavedListingRepository savedListingRepository;
    private final DealAlertService dealAlertService;

    public ListingResponse createListing(User user, CreateListingRequest request) {
        SellerProfile seller = requireSellerProfile(user);

        BigDecimal initialPrice = resolveInitialPrice(
                request.getOriginalPrice(), request.isDiscountActive(), request.getManualDiscountPercent());

        Listing listing = Listing.builder()
                .seller(seller)
                .productName(request.getProductName())
                .category(request.getCategory())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .unitOfMeasurement(request.getUnitOfMeasurement())
                .originalPrice(request.getOriginalPrice())
                .currentPrice(initialPrice)
                .isDiscountActive(request.isDiscountActive())
                .manualDiscountPercent(request.getManualDiscountPercent())
                .expirySensitive(request.isExpirySensitive())
                .expiryDate(request.getExpiryDate())
                .clearanceEndDate(request.getClearanceEndDate())
                .discountStepPercent(request.getDiscountStepPercent())
                .discountIntervalDays(request.getDiscountIntervalDays())
                .minimumAcceptablePrice(request.getMinimumAcceptablePrice())
                .listingStatus(ListingStatus.ACTIVE)
                .images(request.getImages())
                .build();

        Listing saved = listingRepository.save(listing);
        dealAlertService.notifyMatchingAlerts(saved);
        return ListingResponse.from(saved);
    }

    public List<ListingResponse> searchListings(
            String search, String category, String region, String cityTown,
            BigDecimal minPrice, BigDecimal maxPrice, VerificationStatus verificationStatus) {

        return listingRepository
                .findAll(ListingSpecification.withFilters(
                        search, category, region, cityTown, minPrice, maxPrice, verificationStatus))
                .stream()
                .map(ListingResponse::from)
                .collect(Collectors.toList());
    }

    public ListingResponse getListingById(Long id) {
        return ListingResponse.from(findListingOrThrow(id));
    }

    public Listing findListingOrThrow(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
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
        if (request.getIsDiscountActive() != null) listing.setDiscountActive(request.getIsDiscountActive());
        if (request.getExpirySensitive() != null) listing.setExpirySensitive(request.getExpirySensitive());
        if (request.getExpiryDate() != null) listing.setExpiryDate(request.getExpiryDate());
        if (request.getClearanceEndDate() != null) listing.setClearanceEndDate(request.getClearanceEndDate());
        if (request.getDiscountStepPercent() != null) listing.setDiscountStepPercent(request.getDiscountStepPercent());
        if (request.getDiscountIntervalDays() != null) listing.setDiscountIntervalDays(request.getDiscountIntervalDays());
        if (request.getImages() != null) listing.setImages(request.getImages());

        if (request.getListingStatus() != null && request.getListingStatus() != ListingStatus.ARCHIVED) {
            listing.setListingStatus(request.getListingStatus());
        } else if (request.getQuantity() != null) {
            // Keep the status honest about the stock, the way accepting an order
            // already does. Editing the count down to zero should read as sold
            // out, and restocking a sold-out listing should put it back on the
            // market — otherwise a listing sits at "0 available" while ACTIVE.
            if (listing.getQuantity() == 0) {
                listing.setListingStatus(ListingStatus.OUT_OF_STOCK);
            } else if (listing.getListingStatus() == ListingStatus.OUT_OF_STOCK) {
                listing.setListingStatus(ListingStatus.ACTIVE);
            }
        }

        if (request.getMinimumAcceptablePrice() != null) {
            listing.setMinimumAcceptablePrice(request.getMinimumAcceptablePrice());
        }
        if (request.getManualDiscountPercent() != null) {
            listing.setManualDiscountPercent(request.getManualDiscountPercent());
        }

        if (!listing.isDiscountActive() && listing.getManualDiscountPercent() != null) {
            listing.setCurrentPrice(applyPercent(listing.getOriginalPrice(), listing.getManualDiscountPercent()));
        } else if (listing.isDiscountActive()) {
            listing.setCurrentPrice(listing.getOriginalPrice());
        } else if (request.getCurrentPrice() != null) {
            if (listing.getMinimumAcceptablePrice() != null &&
                    request.getCurrentPrice().compareTo(listing.getMinimumAcceptablePrice()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Current price cannot go below minimum acceptable price of " +
                                listing.getMinimumAcceptablePrice());
            }
            listing.setCurrentPrice(request.getCurrentPrice());
        }

        return ListingResponse.from(listingRepository.save(listing));
    }

    public void archiveListing(User user, Long id) {
        SellerProfile seller = requireSellerProfile(user);
        Listing listing = findListingOrThrow(id);

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only archive your own listings");
        }

        boolean hasActiveRequests = purchaseRequestRepository.existsByListingAndStatusIn(
                listing, List.of(PurchaseRequestStatus.PENDING, PurchaseRequestStatus.ACCEPTED));
        if (hasActiveRequests) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot archive listing with pending or accepted purchase requests");
        }

        listing.setListingStatus(ListingStatus.ARCHIVED);
        listingRepository.save(listing);
    }

    // Un-archive: put an archived listing back on the marketplace.
    public ListingResponse repostListing(User user, Long id) {
        SellerProfile seller = requireSellerProfile(user);
        Listing listing = findListingOrThrow(id);

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only repost your own listings");
        }
        if (listing.getListingStatus() != ListingStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only archived listings can be reposted");
        }

        listing.setListingStatus(ListingStatus.ACTIVE);
        return ListingResponse.from(listingRepository.save(listing));
    }

    // Hard delete an archived listing. Blocked only when a real transaction
    // exists (a completed/in-progress order carries evidence and reviews that
    // shouldn't be discarded). Otherwise its purchase requests and saved
    // entries are removed first so the row's foreign keys don't block deletion.
    @Transactional
    public void permanentlyDeleteListing(User user, Long id) {
        SellerProfile seller = requireSellerProfile(user);
        Listing listing = findListingOrThrow(id);

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own listings");
        }
        if (listing.getListingStatus() != ListingStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Archive the listing before deleting it permanently");
        }
        if (transactionRepository.existsByListing(listing)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This listing has a completed order and can't be permanently deleted; it stays archived");
        }

        purchaseRequestRepository.deleteByListing(listing);
        savedListingRepository.deleteByListing(listing);
        listingRepository.delete(listing);
    }

    public List<ListingResponse> getHighUrgencyListings() {
        return listingRepository.findHighUrgencyListings()
                .stream().map(ListingResponse::from).collect(Collectors.toList());
    }

    public List<ListingResponse> getSellerListings(User user) {
        SellerProfile seller = requireSellerProfile(user);
        return listingRepository.findBySeller(seller)
                .stream().map(ListingResponse::from).collect(Collectors.toList());
    }

    private BigDecimal resolveInitialPrice(BigDecimal originalPrice, boolean discountActive, BigDecimal manualDiscountPercent) {
        if (discountActive) {
            return originalPrice;
        }
        if (manualDiscountPercent != null) {
            return applyPercent(originalPrice, manualDiscountPercent);
        }
        return originalPrice;
    }

    private BigDecimal applyPercent(BigDecimal base, BigDecimal percent) {
        return base.multiply(BigDecimal.ONE.subtract(
                        percent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private SellerProfile requireSellerProfile(User user) {
        return sellerRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "A seller profile is required to manage listings"));
    }
}
