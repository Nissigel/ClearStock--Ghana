package com.clearstock.backend.messaging;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.messaging.dto.ConversationResponse;
import com.clearstock.backend.messaging.dto.MessageResponse;
import com.clearstock.backend.messaging.dto.SendMessageRequest;
import com.clearstock.backend.messaging.dto.StartConversationRequest;
import com.clearstock.backend.transactions.PurchaseRequestRepository;
import com.clearstock.backend.transactions.PurchaseRequestStatus;
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

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;

    public ConversationResponse startConversation(User buyer, StartConversationRequest request) {
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        User seller = listing.getSeller().getUser();

        if (buyer.getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot message your own listing");
        }

        return conversationRepository.findByListingAndBuyer(listing, buyer)
                .map(this::mapToConversationResponse)
                .orElseGet(() -> {
                    Conversation conversation = Conversation.builder()
                            .listing(listing)
                            .buyer(buyer)
                            .seller(seller)
                            .status(ConversationStatus.ACTIVE)
                            .build();
                    return mapToConversationResponse(conversationRepository.save(conversation));
                });
    }

    public List<ConversationResponse> getInbox(User user) {
        return conversationRepository.findByBuyerOrSellerOrderByUpdatedAtDesc(user, user)
                .stream()
                .filter(c -> !isHiddenFor(c, user))
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    /** True when the user has "deleted for me" this conversation. */
    private boolean isHiddenFor(Conversation conversation, User user) {
        boolean isBuyer = conversation.getBuyer().getId().equals(user.getId());
        return isBuyer ? conversation.isDeletedForBuyer() : conversation.isDeletedForSeller();
    }

    public ConversationResponse getConversationByListing(User buyer, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        return conversationRepository.findByListingAndBuyer(listing, buyer)
                .map(this::mapToConversationResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No conversation found for this listing"));
    }

    public ConversationResponse getConversation(User user, Long conversationId) {
        return mapToConversationResponse(findConversationForParticipant(user, conversationId));
    }

    @Transactional
    public MessageResponse sendMessage(User sender, SendMessageRequest request) {
        Conversation conversation = findConversationForParticipant(sender, request.getConversationId());

        if (conversation.getStatus() == ConversationStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot send messages in a closed conversation");
        }

        // A new message revives the conversation for anyone who had hidden it.
        if (conversation.isDeletedForBuyer() || conversation.isDeletedForSeller()) {
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

    private ConversationResponse mapToConversationResponse(Conversation conversation) {
        boolean phonesVisible = purchaseRequestRepository.existsByListingAndBuyerAndStatusIn(
                conversation.getListing(),
                conversation.getBuyer(),
                List.of(PurchaseRequestStatus.ACCEPTED, PurchaseRequestStatus.COMPLETED));

        return ConversationResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListing().getId())
                .listingProductName(conversation.getListing().getProductName())
                .buyerUserId(conversation.getBuyer().getId())
                .sellerUserId(conversation.getSeller().getId())
                .buyerPhone(phonesVisible ? conversation.getBuyer().getPhone() : null)
                .sellerPhone(phonesVisible ? conversation.getSeller().getPhone() : null)
                .status(conversation.getStatus())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
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
