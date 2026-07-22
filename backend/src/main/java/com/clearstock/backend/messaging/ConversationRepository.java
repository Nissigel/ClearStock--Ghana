package com.clearstock.backend.messaging;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByBuyerOrSellerOrderByUpdatedAtDesc(User buyer, User seller);

    Optional<Conversation> findByListingAndBuyer(Listing listing, User buyer);

    Optional<Conversation> findByListingAndBuyerAndSeller(Listing listing, User buyer, User seller);
}
