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

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.reviewee.id = :userId")
    Double findAverageRatingByRevieweeId(@Param("userId") Long userId);

    long countByRevieweeId(Long revieweeId);

    List<Review> findAllByOrderByCreatedAtDesc();
}
