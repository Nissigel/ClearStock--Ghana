package com.clearstock.backend.listings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class UrgencyScoreScheduler {

    private final ListingRepository listingRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void recalculateUrgencyScores() {
        calculateNow();
    }

    @Transactional
    public void calculateNow() {
        List<Listing> active = listingRepository.findByListingStatus(ListingStatus.ACTIVE);
        LocalDate today = LocalDate.now();

        for (Listing listing : active) {
            int score = computeScore(listing, today);
            listing.setUrgencyScore(score);
            listing.setIsHighUrgency(score >= 70);
            listingRepository.save(listing);
        }

        log.info("Urgency scores recalculated for {} active listings", active.size());
    }

    private int computeScore(Listing listing, LocalDate today) {
        double expiryUrgency = computeExpiryUrgency(listing, today);
        double discountUrgency = computeDiscountUrgency(listing);
        double viewsUrgency = computeViewsUrgency(listing);

        double raw = (expiryUrgency * 0.4) + (discountUrgency * 0.3) + (viewsUrgency * 0.3);
        return (int) Math.round(raw);
    }

    private double computeExpiryUrgency(Listing listing, LocalDate today) {
        LocalDate dateRef = listing.getExpiryDate() != null
                ? listing.getExpiryDate()
                : listing.getClearanceEndDate();
        if (dateRef == null) {
            return 0;
        }
        long daysUntil = ChronoUnit.DAYS.between(today, dateRef);
        double raw = 100.0 - ((daysUntil / 30.0) * 100.0);
        return Math.min(100, Math.max(0, raw));
    }

    private double computeDiscountUrgency(Listing listing) {
        if (listing.getDiscountStepPercent() == null) {
            return 0;
        }
        double raw = (listing.getDiscountStepPercent().doubleValue() / 50.0) * 100.0;
        return Math.min(100, Math.max(0, raw));
    }

    private double computeViewsUrgency(Listing listing) {
        int views = listing.getViewsCount() != null ? listing.getViewsCount() : 0;
        return Math.min(views / 100.0, 1.0) * 100.0;
    }
}
