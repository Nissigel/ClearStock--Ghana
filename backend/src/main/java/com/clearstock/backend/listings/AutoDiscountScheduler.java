package com.clearstock.backend.listings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoDiscountScheduler {

    private final ListingRepository listingRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void runDailyListingMaintenance() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        expireListings(today);
        autoActivateDiscounts(today);
        applyScheduledDiscounts(now);
    }

    private void expireListings(LocalDate today) {
        List<Listing> expired = listingRepository
                .findByListingStatusAndExpiryDateIsNotNullAndExpiryDateBefore(
                        ListingStatus.ACTIVE, today);

        for (Listing listing : expired) {
            listing.setListingStatus(ListingStatus.EXPIRED);
            listingRepository.save(listing);
            log.info("Listing {} expired (expiry date: {})", listing.getId(), listing.getExpiryDate());
        }
    }

    private void autoActivateDiscounts(LocalDate today) {
        List<Listing> approaching = listingRepository
                .findByListingStatusAndIsDiscountActiveFalseAndExpiryDateIsNotNullAndExpiryDateBetween(
                        ListingStatus.ACTIVE, today, today.plusDays(21));

        for (Listing listing : approaching) {
            listing.setDiscountActive(true);
            listingRepository.save(listing);
            log.info("Auto-activated discount for listing {} (expiry date: {})",
                    listing.getId(), listing.getExpiryDate());
        }
    }

    private void applyScheduledDiscounts(LocalDateTime now) {
        List<Listing> candidates = listingRepository
                .findByListingStatusAndIsDiscountActiveTrueAndDiscountStepPercentIsNotNullAndDiscountIntervalDaysIsNotNull(
                        ListingStatus.ACTIVE);

        for (Listing listing : candidates) {
            LocalDateTime baseline = listing.getLastDiscountAppliedAt() != null
                    ? listing.getLastDiscountAppliedAt()
                    : listing.getCreatedAt();

            if (baseline.plusDays(listing.getDiscountIntervalDays()).isAfter(now)) {
                continue;
            }

            BigDecimal reduction = listing.getCurrentPrice()
                    .multiply(listing.getDiscountStepPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            BigDecimal newPrice = listing.getCurrentPrice().subtract(reduction);

            if (listing.getMinimumAcceptablePrice() != null &&
                    newPrice.compareTo(listing.getMinimumAcceptablePrice()) < 0) {
                newPrice = listing.getMinimumAcceptablePrice();
            }

            listing.setCurrentPrice(newPrice);
            listing.setLastDiscountAppliedAt(now);
            listingRepository.save(listing);

            log.info("Auto-discount applied to listing {} — new price: {}", listing.getId(), newPrice);
        }
    }
}
