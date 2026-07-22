package com.clearstock.backend.listings;

import com.clearstock.backend.notifications.NotificationService;
import com.clearstock.backend.notifications.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A listing drops to OUT_OF_STOCK automatically once its last unit is sold. If
 * the seller doesn't restock or otherwise touch it within the grace period, it
 * is archived so the marketplace isn't left advertising stock nobody can buy.
 *
 * Archiving rather than deleting is deliberate: the seller keeps the listing
 * under "Archived" and can repost it once restocked.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SoldOutListingArchiveScheduler {

    private static final int GRACE_HOURS = 24;

    private final ListingRepository listingRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 30 * * * *")
    @Transactional
    public void archiveStaleSoldOutListings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(GRACE_HOURS);

        // updatedAt is refreshed by any edit or restock, so anything still
        // OUT_OF_STOCK and untouched since the cutoff was genuinely left alone.
        List<Listing> stale = listingRepository
                .findByListingStatusAndUpdatedAtBefore(ListingStatus.OUT_OF_STOCK, cutoff);

        for (Listing listing : stale) {
            log.info("Archiving listing {} — sold out and untouched for {} hours",
                    listing.getId(), GRACE_HOURS);
            listing.setListingStatus(ListingStatus.ARCHIVED);
            listingRepository.save(listing);

            notificationService.send(
                    listing.getSeller().getUser(),
                    "Listing archived",
                    listing.getProductName() + " sold out and wasn't restocked within "
                            + GRACE_HOURS + " hours, so it was archived. You can repost it "
                            + "from your listings once you have stock again.",
                    NotificationType.DEAL_ALERT,
                    listing.getId()
            );
        }
    }
}
