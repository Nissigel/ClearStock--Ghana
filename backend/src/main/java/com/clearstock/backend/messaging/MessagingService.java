package com.clearstock.backend.messaging;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.messaging.dto.ConversationResponse;
import com.clearstock.backend.messaging.dto.MessageResponse;
import com.clearstock.backend.messaging.dto.SendMessageRequest;
import com.clearstock.backend.messaging.dto.StartConversationRequest;
import com.clearstock.backend.transactions.PurchaseRequestRepository;
import com.clearstock.backend.transactions.PurchaseRequestStatus;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.transactions.TransactionStatus;
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
public class MessagingService {

    private static final String DELETED_PLACEHOLDER = "This message was deleted";
    private static final int EDIT_WINDOW_MINUTES = 3;

    private static final String CLOSED_REASON = "This conversation is closed.";
    private static final String COMPLETED_REASON =
            "This transaction is over — you can no longer message each other here.";

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final TransactionRepository transactionRepository;

    public ConversationResponse startConversation(User buyer, StartConversationRequest request) {
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        User seller = listing.getSeller().getUser();

        if (buyer.getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot message your own listing");
        }

        return conversationRepository.findByListingAndBuyer(listing, buyer)
                .map(c -> mapToConversationResponse(c, buyer))
                .orElseGet(() -> {
                    Conversation conversation = Conversation.builder()
                            .listing(listing)
                            .buyer(buyer)
                            .seller(seller)
                            .status(ConversationStatus.ACTIVE)
                            .build();
                    return mapToConversationResponse(conversationRepository.save(conversation), buyer);
                });
    }

    public List<ConversationResponse> getInbox(User user) {
        return conversationRepository.findByBuyerOrSellerOrderByUpdatedAtDesc(user, user)
                .stream()
                .filter(c -> !isHiddenFor(c, user))
                .map(c -> mapToConversationResponse(c, user))
                .collect(Collectors.toList());
    }

    /** True when the user has "deleted for me" this conversation. */
    private boolean isHiddenFor(Conversation conversation, User user) {
        boolean isBuyer = conversation.getBuyer().getId().equals(user.getId());
        // Null (rows that predate these columns) means "not hidden".
        return isBuyer
                ? Boolean.TRUE.equals(conversation.getDeletedForBuyer())
                : Boolean.TRUE.equals(conversation.getDeletedForSeller());
    }

    public ConversationResponse getConversationByListing(User buyer, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        return conversationRepository.findByListingAndBuyer(listing, buyer)
                .map(c -> mapToConversationResponse(c, buyer))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No conversation found for this listing"));
    }

    public ConversationResponse getConversation(User user, Long conversationId) {
        return mapToConversationResponse(findConversationForParticipant(user, conversationId), user);
    }

    @Transactional
    public MessageResponse sendMessage(User sender, SendMessageRequest request) {
        Conversation conversation = findConversationForParticipant(sender, request.getConversationId());

        String lockedReason = messagingLockedReason(conversation);
        if (lockedReason != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, lockedReason);
        }

        // A new message revives the conversation for anyone who had hidden it.
        if (Boolean.TRUE.equals(conversation.getDeletedForBuyer())
                || Boolean.TRUE.equals(conversation.getDeletedForSeller())) {
            conversation.setDeletedForBuyer(false);
            conversation.setDeletedForSeller(false);
            conversationRepository.save(conversation);
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .messageContent(request.getMessageContent())
                .build();

        return mapToMessageResponse(messageRepository.save(message));
    }

    @Transactional
    public List<MessageResponse> getMessages(User user, Long conversationId) {
        Conversation conversation = findConversationForParticipant(user, conversationId);
        List<Message> messages = messageRepository.findByConversationOrderByCreatedAtAsc(conversation);

        LocalDateTime now = LocalDateTime.now();
        messages.forEach(m -> {
            if (!m.getSender().getId().equals(user.getId()) && !m.isSeen() && m.getDeletedAt() == null) {
                m.setSeen(true);
                m.setSeenAt(now);
                messageRepository.save(m);
            }
        });

        return messages.stream().map(this::mapToMessageResponse).collect(Collectors.toList());
    }

    public void deleteMessage(User sender, Long messageId) {
        Message message = messageRepository.findByIdAndSender(messageId, sender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (message.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message already deleted");
        }

        // Soft delete — the bubble shows "This message was deleted" to both sides,
        // so a sender can retract a mistake even after it has been seen.
        message.setDeletedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    @Transactional
    public MessageResponse editMessage(User sender, Long messageId, String newContent) {
        Message message = messageRepository.findByIdAndSender(messageId, sender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (message.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot edit a deleted message");
        }
        if (message.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(EDIT_WINDOW_MINUTES))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Messages can only be edited within " + EDIT_WINDOW_MINUTES + " minutes of sending");
        }

        message.setMessageContent(newContent);
        message.setEditedAt(LocalDateTime.now());
        return mapToMessageResponse(messageRepository.save(message));
    }

    @Transactional
    public void deleteConversation(User user, Long conversationId) {
        Conversation conversation = findConversationForParticipant(user, conversationId);
        // "Delete for me" — hide it from this user's inbox only.
        if (conversation.getBuyer().getId().equals(user.getId())) {
            conversation.setDeletedForBuyer(true);
        } else {
            conversation.setDeletedForSeller(true);
        }
        conversationRepository.save(conversation);
    }

    private Conversation findConversationForParticipant(User user, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        boolean isParticipant = conversation.getBuyer().getId().equals(user.getId())
                || conversation.getSeller().getId().equals(user.getId());
        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return conversation;
    }

    private ConversationResponse mapToConversationResponse(Conversation conversation, User viewer) {
        // Contact numbers appear once the seller accepts the request, and are
        // hidden again once the deal is done, so a number is only shared for as
        // long as the two actually need to reach each other.
        boolean phonesVisible = purchaseRequestRepository.existsByListingAndBuyerAndStatusIn(
                conversation.getListing(),
                conversation.getBuyer(),
                List.of(PurchaseRequestStatus.ACCEPTED, PurchaseRequestStatus.COMPLETED))
                && !transactionOver(conversation);

        Message latest = messageRepository
                .findFirstByConversationOrderByCreatedAtDesc(conversation)
                .orElse(null);

        String lockedReason = messagingLockedReason(conversation);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListing().getId())
                .listingProductName(conversation.getListing().getProductName())
                .buyerUserId(conversation.getBuyer().getId())
                .sellerUserId(conversation.getSeller().getId())
                .buyerPhone(phonesVisible ? conversation.getBuyer().getPhone() : null)
                .sellerPhone(phonesVisible ? conversation.getSeller().getPhone() : null)
                .buyerName(displayNameOf(conversation.getBuyer()))
                // Buyers know a seller by their shop, so prefer the business name.
                .sellerName(shopNameOf(conversation.getListing(), conversation.getSeller()))
                .buyerProfileImageUrl(conversation.getBuyer().getProfileImageUrl())
                .sellerProfileImageUrl(conversation.getSeller().getProfileImageUrl())
                .lastMessageContent(latest == null
                        ? null
                        : (latest.getDeletedAt() != null ? DELETED_PLACEHOLDER : latest.getMessageContent()))
                .lastMessageAt(latest == null ? null : latest.getCreatedAt())
                .lastMessageSenderId(latest == null ? null : latest.getSender().getId())
                .unreadCount(messageRepository
                        .countByConversationAndSenderNotAndSeenFalse(conversation, viewer))
                .status(conversation.getStatus())
                .canSendMessages(lockedReason == null)
                .messagingLockedReason(lockedReason)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    /**
     * Why messaging is closed for this conversation, or null while it is still
     * open. A conversation closes when it is marked CLOSED, or once the buyer
     * and seller have rated their deal — at that point the transaction is over
     * and there is nothing left for them to arrange.
     */
    private String messagingLockedReason(Conversation conversation) {
        if (conversation.getStatus() == ConversationStatus.CLOSED) {
            return CLOSED_REASON;
        }
        return transactionOver(conversation) ? COMPLETED_REASON : null;
    }

    /**
     * True once this buyer and seller have a completed transaction on this
     * listing. The deal is finished at that point, so the conversation closes
     * and the contact numbers are hidden again — there is nothing left to
     * arrange, and neither side needs the other's number any more.
     */
    private boolean transactionOver(Conversation conversation) {
        return transactionRepository
                .existsByListingAndBuyerAndSellerAndTransactionStatus(
                        conversation.getListing(),
                        conversation.getBuyer(),
                        conversation.getSeller(),
                        TransactionStatus.COMPLETED);
    }

    /**
     * A human label for a user. Accounts created before the sign-up form saved a
     * name still carry their phone number as their name, so fall back rather
     * than showing a blank.
     */
    private String displayNameOf(User user) {
        String name = user.getName();
        if (name == null || name.isBlank() || name.equals(user.getPhone())) {
            return null;
        }
        return name;
    }

    /** The shop's name for this listing, falling back to the seller's own name. */
    private String shopNameOf(Listing listing, User seller) {
        String business = listing.getSeller() != null ? listing.getSeller().getBusinessName() : null;
        if (business != null && !business.isBlank()) {
            return business;
        }
        return displayNameOf(seller);
    }

    private MessageResponse mapToMessageResponse(Message message) {
        boolean isDeleted = message.getDeletedAt() != null;
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderUserId(message.getSender().getId())
                .messageContent(isDeleted ? DELETED_PLACEHOLDER : message.getMessageContent())
                .deleted(isDeleted)
                .seen(message.isSeen())
                .seenAt(message.getSeenAt())
                .createdAt(message.getCreatedAt())
                .editedAt(isDeleted ? null : message.getEditedAt())
                .build();
    }
}
