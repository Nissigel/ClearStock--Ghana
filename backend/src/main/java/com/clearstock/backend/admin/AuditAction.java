package com.clearstock.backend.admin;

/** Every admin action that changes something is recorded as one of these. */
public enum AuditAction {
    APPROVED_VERIFICATION,
    REJECTED_VERIFICATION,
    SUSPENDED_USER,
    REACTIVATED_USER,
    SUSPENDED_LISTING,
    RESTORED_LISTING,
    ARCHIVED_LISTING,
    ACTIONED_REPORT,
    DISMISSED_REPORT,
    CREATED_ADMIN,
    DISABLED_ADMIN,
    ENABLED_ADMIN,
    CHANGED_ADMIN_ROLE
}
