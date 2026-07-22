package com.clearstock.backend.admin;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A record of one admin action.
 *
 * The target is stored as a type plus an id plus a label rather than as a
 * foreign key, because an entry must survive the thing it refers to being
 * deleted — an audit log that loses rows when a listing is removed is not an
 * audit log. The label is captured at the time of the action so the entry
 * still reads sensibly later.
 */
@Entity
@Table(name = "admin_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    /** VERIFICATION, LISTING, USER, REPORT or ADMIN. */
    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    /** Human-readable name of the target, as it was when the action happened. */
    @Column(name = "target_label")
    private String targetLabel;

    /** Why, where the action takes a reason (rejection, suspension). */
    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
