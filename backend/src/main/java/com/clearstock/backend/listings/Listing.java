package com.clearstock.backend.listings;

import com.clearstock.backend.seller.SellerProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
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

    @Column(nullable = false)
    @Builder.Default
    private boolean expirySensitive = false;

    private LocalDate expiryDate;

    private LocalDate clearanceEndDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountStepPercent;

    private Integer discountIntervalDays;

    private LocalDateTime lastDiscountAppliedAt;

    @Column(precision = 15, scale = 2)
    private BigDecimal minimumAcceptablePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingStatus listingStatus = ListingStatus.ACTIVE;

    @ElementCollection(fetch = FetchType.EAGER)
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
}
