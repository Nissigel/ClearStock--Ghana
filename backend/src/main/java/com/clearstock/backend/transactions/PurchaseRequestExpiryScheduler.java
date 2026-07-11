package com.clearstock.backend.transactions;

import com.clearstock.backend.messaging.ConversationRepository;
import com.clearstock.backend.messaging.ConversationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequestExpiryScheduler {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ConversationRepository conversationRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expirePendingRequests() {
        LocalDateTime now = LocalDateTime.now();
        List<PurchaseRequest> expired = purchaseRequestRepository
                .findByStatusAndExpiresAtBefore(PurchaseRequestStatus.PENDING, now);

        for (PurchaseRequest req : expired) {
            req.setStatus(PurchaseRequestStatus.EXPIRED);
            purchaseRequestRepository.save(req);
            log.info("Purchase request {} expired", req.getId());

            conversationRepository.findByListingAndBuyerAndSeller(
                    req.getListing(), req.getBuyer(), req.getSeller())
                    .ifPresent(conv -> {
                        conv.setStatus(ConversationStatus.CLOSED);
                        conversationRepository.save(conv);
                        log.info("Conversation {} closed — purchase request expired", conv.getId());
                    });
        }
    }
}
