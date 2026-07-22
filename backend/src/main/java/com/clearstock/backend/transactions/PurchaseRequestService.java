package com.clearstock.backend.transactions;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.listings.ListingStatus;
import com.clearstock.backend.messaging.Conversation;
import com.clearstock.backend.messaging.ConversationRepository;
import com.clearstock.backend.messaging.ConversationStatus;
import com.clearstock.backend.messaging.Message;
import com.clearstock.backend.messaging.MessageRepository;
import com.clearstock.backend.notifications.NotificationService;
import com.clearstock.backend.notifications.NotificationType;
import com.clearstock.backend.transactions.dto.CreatePurchaseRequestRequest;
import com.clearstock.backend.transactions.dto.PurchaseRequestResponse;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final NotificationService notificationService;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

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

        PurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);

        notificationService.send(
                sellerUser,
                "New Purchase Request",
                buyer.getName() + " wants to buy " + request.getRequestedQuantity()
                        + "x " + listing.getProductName(),
                NotificationType.PURCHASE_REQUEST,
                saved.getId()
        );

        return mapToResponse(saved);
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

    public List<PurchaseRequestResponse> getSellerRequests(User seller) {
        return purchaseRequestRepository.findBySellerOrderByCreatedAtDesc(seller)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public PurchaseRequestResponse declinePurchaseRequest(User seller, Long id) {
        PurchaseRequest request = purchaseRequestRepository.findByIdAndSeller(id, seller)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase request not found"));

        if (request.getStatus() != PurchaseRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending purchase requests can be declined");
        }

        request.setStatus(PurchaseRequestStatus.DECLINED);
        PurchaseRequest saved = purchaseRequestRepository.save(request);

        // Open the thread with an automatic note so the buyer gets a reason
        // rather than a bare notification, and the seller can follow up in the
        // same conversation to explain.
        postMessageFromSeller(saved,
                "Hi — sorry, I can't accept your request for "
                        + saved.getRequestedQuantity() + "x "
                        + saved.getListing().getProductName()
                        + " right now. Feel free to reply here if you'd like to discuss it.");

        notificationService.send(
                request.getBuyer(),
                "Purchase Request Declined",
                "Your request for " + request.getListing().getProductName()
                        + " was declined by the seller. Check your messages for details.",
                NotificationType.PURCHASE_REQUEST,
                saved.getId()
        );

        return mapToResponse(saved);
    }

    /**
     * Post a message from the seller into the buyer/seller thread for this
     * request's listing, creating (or reviving) the conversation if needed.
     */
    private void postMessageFromSeller(PurchaseRequest request, String text) {
        Conversation conversation = conversationRepository
                .findByListingAndBuyer(request.getListing(), request.getBuyer())
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .listing(request.getListing())
                        .buyer(request.getBuyer())
                        .seller(request.getSeller())
                        .status(ConversationStatus.ACTIVE)
                        .build()));

        // Make sure the thread is visible and writable for both sides again.
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setDeletedForBuyer(false);
        conversation.setDeletedForSeller(false);
        conversationRepository.save(conversation);

        messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(request.getSeller())
                .messageContent(text)
                .build());

        // Record which thread this request belongs to, so the app can take the
        // seller straight into it after declining to explain themselves.
        request.setConversationId(String.valueOf(conversation.getId()));
        purchaseRequestRepository.save(request);
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
