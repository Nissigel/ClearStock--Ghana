package com.clearstock.backend.transactions;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    boolean existsByTransactionAndReviewer(Transaction transaction, User reviewer);

    /**
     * Has this buyer/seller pair already rated their deal on this listing? Once
     * a review exists the transaction is finished, which is the signal we use to
     * close the conversation — there is nothing left to arrange.
     */
    @Query("SELECT COUNT(r) > 0 FROM Review r "
            + "WHERE r.transaction.listing.id = :listingId "
            + "AND r.transaction.buyer.id = :buyerId "
            + "AND r.transaction.seller.id = :sellerId")
    boolean existsForListingAndBuyerAndSeller(@Param("listingId") Long listingId,
                                              @Param("buyerId") Long buyerId,
                                              @Param("sellerId") Long sellerId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageRatingByRevieweeId(@Param("userId") Long userId);

    long countByRevieweeId(Long revieweeId);

    List<Review> findAllByOrderByCreatedAtDesc();
}
