package com.clearstock.backend.admin;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A staff account for the admin dashboard.
 *
 * Deliberately separate from {@code User}. App users sign in with a phone
 * number and a PIN and must have a region and city; admins sign in with an
 * email and a password and have none of those. Folding admins into the users
 * table would mean inventing fake phone numbers to satisfy its NOT NULL
 * columns, and would risk a member of staff being treated as a trader.
 */
@Entity
@Table(name = "admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AdminRole role = AdminRole.ADMIN;

    /**
     * Disabled admins keep their history so the audit log still reads
     * correctly, but can no longer sign in.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
