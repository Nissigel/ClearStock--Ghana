package com.clearstock.backend.listings;

import com.clearstock.backend.seller.SellerProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String unitOfMeasurement;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal currentPrice;

    // Boxed (not primitive) so existing rows with a NULL value in this
    // column don't crash Hibernate on load — primitive boolean can't bind
    // to a null column value. Defaulted to false and kept non-null for new
    // rows via the field initializer + @PrePersist/@PreUpdate below.
    @Column(nullable = false)
    @Builder.Default
    private Boolean expirySensitive = false;

    private LocalDate expiryDate;

    private LocalDate clearanceEndDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountStepPercent;

    private Integer discountIntervalDays;

    @Column(name = "manual_discount_percent", precision = 5, scale = 2)
    private BigDecimal manualDiscountPercent;

    private LocalDateTime lastDiscountAppliedAt;

    @Column(precision = 15, scale = 2)
    private BigDecimal minimumAcceptablePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingStatus listingStatus = ListingStatus.ACTIVE;

    @Column(name = "urgency_score")
    @Builder.Default
    private Integer urgencyScore = 0;

    @Column(name = "is_high_urgency")
    @Builder.Default
    private Boolean isHighUrgency = false;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    // Same reasoning as expirySensitive above — this is exactly the field
    // that was crashing GET /listings: existing rows have NULL here (the
    // column predates this constraint), and a primitive boolean can't
    // absorb that on read.
    @Column(name = "is_discount_active", nullable = false)
    @Builder.Default
    private Boolean isDiscountActive = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @Fetch(FetchMode.SUBSELECT)
    @CollectionTable(name = "listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url", nullable = false)
    @OrderColumn(name = "image_order")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Belt-and-braces: guarantee these are never persisted as null, even if
    // some future code path sets them explicitly via the boxed setters.
    @PrePersist
    @PreUpdate
    private void normalizeBooleanDefaults() {
        if (expirySensitive == null) {
            expirySensitive = false;
        }
        if (isDiscountActive == null) {
            isDiscountActive = false;
        }
    }
}
