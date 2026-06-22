package com.clearstock.backend.transactions;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.listings.ListingStatus;
import com.clearstock.backend.transactions.dto.CreatePurchaseRequestRequest;
import com.clearstock.backend.transactions.dto.PurchaseRequestResponse;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseRequestService {

    private static final int EXPIRY_DAYS = 7;

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ListingRepository listingRepository;

    public PurchaseRequestResponse createPurchaseRequest(User buyer, CreatePurchaseRequestRequest request) {
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (listing.getListingStatus() != ListingStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Purchase requests can only be made for active listings");
        }

        User sellerUser = listing.getSeller().getUser();

        if (buyer.getId().equals(sellerUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot submit a purchase request for your own listing");
        }

        PurchaseRequest purchaseRequest = PurchaseRequest.builder()
                .listing(listing)
                .buyer(buyer)
                .seller(sellerUser)
                .requestedQuantity(request.getRequestedQuantity())
                .status(PurchaseRequestStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(EXPIRY_DAYS))
                .build();

        return mapToResponse(purchaseRequestRepository.save(purchaseRequest));
    }

    public List<PurchaseRequestResponse> getBuyerRequests(User buyer) {
        return purchaseRequestRepository.findByBuyerOrderByCreatedAtDesc(buyer)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PurchaseRequestResponse getPurchaseRequest(User buyer, Long id) {
        PurchaseRequest request = purchaseRequestRepository.findByIdAndBuyer(id, buyer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase request not found"));
        return mapToResponse(request);
    }

    public PurchaseRequestResponse cancelPurchaseRequest(User buyer, Long id) {
        PurchaseRequest request = purchaseRequestRepository.findByIdAndBuyer(id, buyer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase request not found"));

        if (request.getStatus() != PurchaseRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending purchase requests can be cancelled");
        }

        request.setStatus(PurchaseRequestStatus.CANCELLED);
        return mapToResponse(purchaseRequestRepository.save(request));
    }

    private PurchaseRequestResponse mapToResponse(PurchaseRequest req) {
        boolean phonesVisible = req.getStatus() == PurchaseRequestStatus.ACCEPTED
                || req.getStatus() == PurchaseRequestStatus.COMPLETED;

        return PurchaseRequestResponse.builder()
                .id(req.getId())
                .listingId(req.getListing().getId())
                .listingProductName(req.getListing().getProductName())
                .buyerUserId(req.getBuyer().getId())
                .sellerUserId(req.getSeller().getId())
                .buyerPhone(phonesVisible ? req.getBuyer().getPhone() : null)
                .sellerPhone(phonesVisible ? req.getSeller().getPhone() : null)
                .requestedQuantity(req.getRequestedQuantity())
                .status(req.getStatus())
                .expiresAt(req.getExpiresAt())
                .conversationId(req.getConversationId())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
