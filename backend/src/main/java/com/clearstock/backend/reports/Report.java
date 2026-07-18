package com.clearstock.backend.reports;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Deliberately not mapped to "reports": an older, unused reports table already
 * exists in the database with its own NOT NULL columns (target_id) that this
 * entity never populates, so every insert there fails the constraint. Hibernate's
 * schema update adds missing columns but never drops legacy ones, so this owns
 * its own table rather than fighting that shape.
 */
@Entity
@Table(name = "user_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporter;

    /** Set for USER reports — works in both directions (buyer or seller). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    /** Set for LISTING reports. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id")
    private Listing listing;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType reportType;

    /**
     * A short label such as Fraud or No-show, chosen from a list in the app.
     * Nullable: complaints filed before this existed carry only free text, and
     * Postgres cannot add a NOT NULL column to a populated table.
     */
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.OPEN;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
