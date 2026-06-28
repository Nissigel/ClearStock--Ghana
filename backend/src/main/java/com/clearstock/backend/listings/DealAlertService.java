package com.clearstock.backend.listings;

import com.clearstock.backend.common.EmailService;
import com.clearstock.backend.listings.dto.CreateDealAlertRequest;
import com.clearstock.backend.listings.dto.DealAlertResponse;
import com.clearstock.backend.listings.dto.UpdateDealAlertRequest;
import com.clearstock.backend.notifications.NotificationService;
import com.clearstock.backend.notifications.NotificationType;
import com.clearstock.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealAlertService {

    private final DealAlertRepository dealAlertRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public DealAlertResponse createAlert(User buyer, CreateDealAlertRequest request) {
        DealAlert alert = DealAlert.builder()
                .buyer(buyer)
                .category(request.getCategory())
                .maxPrice(request.getMaxPrice())
                .keywords(request.getKeywords())
                .location(request.getLocation())
                .build();
        return DealAlertResponse.from(dealAlertRepository.save(alert));
    }

    public List<DealAlertResponse> getBuyerAlerts(User buyer) {
        return dealAlertRepository.findByBuyer(buyer)
                .stream().map(DealAlertResponse::from).collect(Collectors.toList());
    }

    public DealAlertResponse updateAlert(User buyer, Long id, UpdateDealAlertRequest request) {
        DealAlert alert = findAlertOrThrow(id);
        if (!alert.getBuyer().getId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own alerts");
        }
        if (request.getCategory() != null) alert.setCategory(request.getCategory());
        if (request.getMaxPrice() != null) alert.setMaxPrice(request.getMaxPrice());
        if (request.getKeywords() != null) alert.setKeywords(request.getKeywords());
        if (request.getLocation() != null) alert.setLocation(request.getLocation());
        if (request.getIsActive() != null) alert.setIsActive(request.getIsActive());
        return DealAlertResponse.from(dealAlertRepository.save(alert));
    }

    public void deleteAlert(User buyer, Long id) {
        DealAlert alert = findAlertOrThrow(id);
        if (!alert.getBuyer().getId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own alerts");
        }
        alert.setIsActive(false);
        dealAlertRepository.save(alert);
    }

    public void notifyMatchingAlerts(Listing listing) {
        List<DealAlert> activeAlerts = dealAlertRepository.findByIsActiveTrue();
        for (DealAlert alert : activeAlerts) {
            if (matches(alert, listing)) {
                sendAlertEmail(alert, listing);
            }
        }
    }

    private boolean matches(DealAlert alert, Listing listing) {
        if (alert.getCategory() != null &&
                !alert.getCategory().equalsIgnoreCase(listing.getCategory())) {
            return false;
        }
        if (alert.getMaxPrice() != null &&
                listing.getCurrentPrice().compareTo(alert.getMaxPrice()) > 0) {
            return false;
        }
        if (alert.getKeywords() != null) {
            String kw = alert.getKeywords().toLowerCase();
            boolean inName = listing.getProductName() != null &&
                    listing.getProductName().toLowerCase().contains(kw);
            boolean inDesc = listing.getDescription() != null &&
                    listing.getDescription().toLowerCase().contains(kw);
            if (!inName && !inDesc) {
                return false;
            }
        }
        if (alert.getLocation() != null) {
            String sellerLocation = listing.getSeller().getBusinessLocation();
            if (sellerLocation == null ||
                    !sellerLocation.toLowerCase().contains(alert.getLocation().toLowerCase())) {
                return false;
            }
        }
        return true;
    }

    private void sendAlertEmail(DealAlert alert, Listing listing) {
        User buyer = alert.getBuyer();

        notificationService.send(
                buyer,
                "Deal Alert: " + listing.getProductName(),
                listing.getProductName() + " in " + listing.getCategory()
                        + " is now available for GHS " + listing.getCurrentPrice() + ".",
                NotificationType.DEAL_ALERT,
                listing.getId()
        );

        if (buyer.getEmail() == null || !Boolean.TRUE.equals(buyer.getPreferEmail())) {
            return;
        }
        emailService.sendDealAlertEmail(
                buyer.getEmail(),
                buyer.getName(),
                listing.getProductName(),
                listing.getCategory(),
                listing.getCurrentPrice(),
                listing.getSeller().getBusinessName(),
                listing.getId()
        );
    }

    private DealAlert findAlertOrThrow(Long id) {
        return dealAlertRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal alert not found"));
    }
}
