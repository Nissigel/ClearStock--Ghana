package com.clearstock.backend.messaging.dto;

import com.clearstock.backend.messaging.ConversationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConversationResponse {

    private Long id;
    private Long listingId;
    private String listingProductName;
    private Long buyerUserId;
    private Long sellerUserId;
    private String buyerPhone;
    private String sellerPhone;

    // Who the other person is, so the inbox can show a name and face instead of
    // falling back to a raw phone number.
    private String buyerName;
    private String sellerName;
    private String buyerProfileImageUrl;
    private String sellerProfileImageUrl;

    // Preview of the thread, so the inbox stops saying "No messages yet" when
    // there are messages — including the ones the app itself posts.
    private String lastMessageContent;
    private LocalDateTime lastMessageAt;
    private Long lastMessageSenderId;
    private long unreadCount;

    private ConversationStatus status;

    // Whether new messages are still allowed. Turns false once the deal is done
    // (the buyer and seller have rated) or the conversation is closed, so the
    // app can lock the chat and explain why with the reason below.
    private boolean canSendMessages;
    private String messagingLockedReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
