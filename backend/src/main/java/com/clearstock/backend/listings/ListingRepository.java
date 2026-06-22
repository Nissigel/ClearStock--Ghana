package com.clearstock.backend.listings;

import com.clearstock.backend.seller.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    List<Listing> findByListingStatus(ListingStatus status);

    List<Listing> findBySeller(SellerProfile seller);

    List<Listing> findByListingStatusAndDiscountStepPercentIsNotNullAndDiscountIntervalDaysIsNotNull(
            ListingStatus status);
}
