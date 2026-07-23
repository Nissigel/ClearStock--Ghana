package com.clearstock.backend.notifications.dto;

import com.clearstock.backend.notifications.Notification;
import com.clearstock.backend.notifications.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private Long relatedId;
    /**
     * Which mode the recipient must be in to act on this — "BUYER", "SELLER"
     * or null when either mode can open it. Computed in NotificationService,
     * so {@link #from} leaves it null.
     */
    private String role;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .relatedId(n.getRelatedId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
