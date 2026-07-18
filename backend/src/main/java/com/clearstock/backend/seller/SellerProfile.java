package com.clearstock.backend.seller;

import com.clearstock.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "seller_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(nullable = false)
    private String businessName;

    private String businessDescription;

    private String businessLocation;

    private String businessPhone;

    private String businessCategory;

    @Column(name = "market_hub")
    private String marketHub;

    @Enumerated(EnumType.STRING)
    @Column(name = "seller_type", nullable = false)
    private SellerType sellerType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

    // Identity and business documents, all optional at sign-up: a seller can
    // start trading straight away and submit these later, which puts them into
    // PENDING review rather than blocking them at registration.
    @Column(name = "ghana_card_number")
    private String ghanaCardNumber;

    @Column(name = "ghana_card_photo_url")
    private String ghanaCardPhotoUrl;

    @Column(name = "business_reg_url")
    private String businessRegUrl;

    /** Why a review was turned down, so the seller knows what to correct. */
    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "documents_submitted_at")
    private LocalDateTime documentsSubmittedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
