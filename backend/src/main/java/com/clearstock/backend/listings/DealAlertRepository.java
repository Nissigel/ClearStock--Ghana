package com.clearstock.backend.listings;

import com.clearstock.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DealAlertRepository extends JpaRepository<DealAlert, Long> {

    List<DealAlert> findByBuyer(User buyer);

    List<DealAlert> findByIsActiveTrue();
}
