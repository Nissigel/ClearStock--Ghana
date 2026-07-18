package com.clearstock.backend.listings;

import com.clearstock.backend.seller.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    List<Listing> findByListingStatus(ListingStatus status);

    List<Listing> findAllByOrderByCreatedAtDesc();

    long countByListingStatus(ListingStatus status);

    /**
     * Newest first. Without an explicit order the database is free to return
     * rows however it likes, which in practice meant oldest first — so a
     * seller's newly created listing sank to the bottom and dropped out of the
     * dashboard's short "your listings" preview.
     */
    List<Listing> findBySellerOrderByCreatedAtDesc(SellerProfile seller);

    List<Listing> findByListingStatusAndDiscountStepPercentIsNotNullAndDiscountIntervalDaysIsNotNull(
            ListingStatus status);

    List<Listing> findByListingStatusAndIsDiscountActiveTrueAndDiscountStepPercentIsNotNullAndDiscountIntervalDaysIsNotNull(
            ListingStatus status);

    List<Listing> findByListingStatusAndIsDiscountActiveFalseAndExpiryDateIsNotNullAndExpiryDateBetween(
            ListingStatus status, LocalDate from, LocalDate to);

    List<Listing> findByListingStatusAndExpiryDateIsNotNullAndExpiryDateBefore(
            ListingStatus status, LocalDate date);

    /** Listings sitting in a status untouched since the cutoff (updatedAt). */
    List<Listing> findByListingStatusAndUpdatedAtBefore(
            ListingStatus status, LocalDateTime cutoff);

    @Query("SELECT l FROM Listing l WHERE l.listingStatus = 'ACTIVE' AND l.isHighUrgency = true ORDER BY l.urgencyScore DESC")
    List<Listing> findHighUrgencyListings();
}
