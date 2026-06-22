package com.clearstock.backend.listings;

import com.clearstock.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_listings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "listing_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
