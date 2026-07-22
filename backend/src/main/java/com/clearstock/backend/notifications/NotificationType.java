package com.clearstock.backend.notifications;

public enum NotificationType {
    DEAL_ALERT,
    PURCHASE_REQUEST,
    TRANSACTION,
    REVIEW,
    PAYMENT,
    /** Verification outcomes and moderation decisions made by an admin. */
    ACCOUNT
}
