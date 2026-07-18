package com.clearstock.backend.user;

/**
 * A suspended user keeps their account and history but cannot trade.
 * Null on an existing row means ACTIVE — see the note on User.accountStatus.
 */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED
}
