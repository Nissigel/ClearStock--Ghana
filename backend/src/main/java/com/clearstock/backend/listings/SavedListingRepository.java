package com.clearstock.backend.listings;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedListingRepository extends JpaRepository<SavedListing, Long> {

    List<SavedListing> findByUserOrderByCreatedAtDesc(User user);

    Optional<SavedListing> findByUserAndListing(User user, Listing listing);

    boolean existsByUserAndListing(User user, Listing listing);
}
