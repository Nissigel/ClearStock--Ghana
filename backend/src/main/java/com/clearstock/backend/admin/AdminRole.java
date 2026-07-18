package com.clearstock.backend.admin;

/**
 * SUPER_ADMIN can manage other admin accounts; ADMIN can do everything else.
 * There is exactly one super admin to begin with, seeded on first boot.
 */
public enum AdminRole {
    ADMIN,
    SUPER_ADMIN
}
