package com.clearstock.backend.messaging;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"listing_id", "buyer_user_id", "seller_user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_user_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_user_id", nullable = false)
    private User seller;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    // Per-participant "delete for me": hides the conversation from that user's
    // inbox without affecting the other party. Reset when a new message arrives.
    //
    // Nullable on purpose: these were added to a table that already had rows,
    // and Postgres won't apply NOT NULL to a column full of nulls — that broke
    // the schema update on every boot. A null simply means "not hidden".
    @Column
    @Builder.Default
    private Boolean deletedForBuyer = false;

    @Column
    @Builder.Default
    private Boolean deletedForSeller = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
