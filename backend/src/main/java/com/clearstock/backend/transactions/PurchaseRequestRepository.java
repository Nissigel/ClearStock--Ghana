package com.clearstock.backend.transactions;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    List<PurchaseRequest> findByBuyerOrderByCreatedAtDesc(User buyer);

    Optional<PurchaseRequest> findByIdAndBuyer(Long id, User buyer);

    Optional<PurchaseRequest> findByIdAndSeller(Long id, User seller);

    List<PurchaseRequest> findBySellerOrderByCreatedAtDesc(User seller);

    boolean existsByListingAndStatusIn(Listing listing, List<PurchaseRequestStatus> statuses);

    boolean existsByListing(Listing listing);

    boolean existsByListingAndBuyerAndStatusIn(Listing listing, User buyer, List<PurchaseRequestStatus> statuses);

    List<PurchaseRequest> findByStatusAndExpiresAtBefore(PurchaseRequestStatus status, LocalDateTime now);
}
