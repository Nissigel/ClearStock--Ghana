package com.clearstock.backend.notifications;

import com.clearstock.backend.notifications.dto.NotificationResponse;
import com.clearstock.backend.transactions.PurchaseRequestRepository;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final TransactionRepository transactionRepository;

    public void send(User user, String title, String message, NotificationType type, Long relatedId) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> {
                    NotificationResponse response = NotificationResponse.from(n);
                    response.setRole(roleFor(n));
                    return response;
                })
                .collect(Collectors.toList());
    }

    /**
     * Which mode the recipient must be in to act on a notification. One account
     * is both buyer and seller with a single shared inbox, so the app uses this
     * to prompt "switch to seller/buyer mode" instead of dropping the user on a
     * screen that can't find the request in their current mode. Returns null
     * when either mode can open it (deal alerts, account notices).
     */
    private String roleFor(Notification n) {
        Long relatedId = n.getRelatedId();
        if (relatedId == null) {
            return null;
        }
        Long recipientId = n.getUser().getId();
        switch (n.getType()) {
            case PURCHASE_REQUEST:
                return purchaseRequestRepository.findById(relatedId)
                        .map(pr -> roleOf(recipientId, pr.getBuyer(), pr.getSeller()))
                        .orElse(null);
            case TRANSACTION:
            case PAYMENT:
                return transactionRepository.findById(relatedId)
                        .map(t -> roleOf(recipientId, t.getBuyer(), t.getSeller()))
                        .orElse(null);
            case REVIEW:
                // Reviews are left by buyers about sellers, so the recipient is
                // always the seller being rated.
                return "SELLER";
            default:
                return null;
        }
    }

    private String roleOf(Long recipientId, User buyer, User seller) {
        if (seller != null && seller.getId().equals(recipientId)) {
            return "SELLER";
        }
        if (buyer != null && buyer.getId().equals(recipientId)) {
            return "BUYER";
        }
        return null;
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsRead(user, false);
    }

    @Transactional
    public NotificationResponse markAsRead(User user, Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationResponse markAsUnread(User user, Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        notification.setRead(false);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllReadForUser(user);
    }
}
