package com.clearstock.backend.seller;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<SellerProfile, Long> {

    Optional<SellerProfile> findByUser(User user);

    boolean existsByUser(User user);
}
