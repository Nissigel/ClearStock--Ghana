package com.clearstock.backend.listings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoDiscountScheduler {

    private final ListingRepository listingRepository;

    /**
     * Take listings that are past due off the market. This is the part sellers
     * and buyers actually notice, so it runs often and not just at midnight:
     *
     *  - on startup, because the app is hosted on a free tier that sleeps and
     *    would otherwise sail straight past a scheduled midnight run; waking up
     *    should immediately reconcile anything that expired while it was asleep;
     *  - and hourly, so a listing never lingers on the marketplace for a whole
     *    day after it was due.
     *
     * Buyers are also protected at query time (the feed filters out anything
     * past due), so this exists to keep the stored status honest for the
     * seller's own listings screen and the admin dashboard's counts.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void expireDueListingsOnStartup() {
        expireDueListings(LocalDate.now());
    }

    @Scheduled(cron = "0 5 * * * *")
    @Transactional
    public void expireDueListingsHourly() {
        expireDueListings(LocalDate.now());
    }

    /**
     * The discount machinery is genuinely a once-a-day job — activating
     * discounts as expiry approaches and stepping prices down on their
     * interval — so it stays on the nightly schedule.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void runDailyDiscountMaintenance() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        autoActivateDiscounts(today);
        applyScheduledDiscounts(now);
    }

    private void expireDueListings(LocalDate today) {
        // A listing is "due" once its expiry date has passed (perishable stock)
        // or its clearance sale has ended (everything else). The old sweep only
        // looked at the expiry date, so a dead-stock listing with a clearance
        // end date never came down on its own.
        List<Listing> due = new ArrayList<>(listingRepository
                .findByListingStatusAndExpiryDateIsNotNullAndExpiryDateBefore(
                        ListingStatus.ACTIVE, today));
        due.addAll(listingRepository
                .findByListingStatusAndClearanceEndDateIsNotNullAndClearanceEndDateBefore(
                        ListingStatus.ACTIVE, today));

        for (Listing listing : due) {
            // A listing with both dates set can appear in both queries; once
            // it's expired there's nothing more to do.
            if (listing.getListingStatus() == ListingStatus.EXPIRED) {
                continue;
            }
            listing.setListingStatus(ListingStatus.EXPIRED);
            listingRepository.save(listing);
            log.info("Listing {} expired (expiry date: {}, clearance ends: {})",
                    listing.getId(), listing.getExpiryDate(), listing.getClearanceEndDate());
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
