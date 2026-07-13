package com.clearstock.backend.messaging.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderUserId;
    private String messageContent;
    private boolean deleted;
    private boolean seen;
    private LocalDateTime seenAt;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}
