package com.clearstock.backend.admin;

import com.clearstock.backend.admin.dto.*;
import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.listings.ListingStatus;
import com.clearstock.backend.notifications.NotificationService;
import com.clearstock.backend.notifications.NotificationType;
import com.clearstock.backend.reports.Report;
import com.clearstock.backend.reports.ReportRepository;
import com.clearstock.backend.reports.ReportStatus;
import com.clearstock.backend.reports.ReportType;
import com.clearstock.backend.seller.SellerProfile;
import com.clearstock.backend.seller.SellerRepository;
import com.clearstock.backend.seller.SellerService;
import com.clearstock.backend.seller.VerificationStatus;
import com.clearstock.backend.transactions.PaymentStatus;
import com.clearstock.backend.transactions.PurchaseRequestRepository;
import com.clearstock.backend.transactions.ReviewRepository;
import com.clearstock.backend.transactions.Transaction;
import com.clearstock.backend.transactions.TransactionRepository;
import com.clearstock.backend.transactions.TransactionStatus;
import com.clearstock.backend.user.AccountStatus;
import com.clearstock.backend.user.User;
import com.clearstock.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Everything the dashboard does to the marketplace.
 *
 * Every method that changes something writes an audit entry, because the whole
 * point of a staff tool is being able to answer "who did this, and why".
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final ListingRepository listingRepository;
    private final ReportRepository reportRepository;
    private final TransactionRepository transactionRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    // ---------------------------------------------------------------- stats

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalSellers(sellerRepository.count())
                .verifiedSellers(sellerRepository.countByVerificationStatus(VerificationStatus.VERIFIED))
                .pendingVerifications(sellerRepository.countByVerificationStatus(VerificationStatus.PENDING))
                .totalListings(listingRepository.count())
                .activeListings(listingRepository.countByListingStatus(ListingStatus.ACTIVE))
                .archivedListings(listingRepository.countByListingStatus(ListingStatus.ARCHIVED))
                .suspendedListings(listingRepository.countByListingStatus(ListingStatus.SUSPENDED))
                .openReports(reportRepository.countByStatus(ReportStatus.OPEN))
                .purchaseRequests(purchaseRequestRepository.count())
                .completedTransactions(transactionRepository.count())
                .build();
    }

    // -------------------------------------------------------- verifications

    /** Oldest first: someone who has waited longest should be reviewed first. */
    public List<AdminVerificationResponse> listVerifications(VerificationStatus status) {
        List<SellerProfile> profiles = status == null
                ? sellerRepository.findAllByOrderByCreatedAtDesc()
                : sellerRepository.findByVerificationStatus(status);

        return profiles.stream()
                .filter(p -> p.getDocumentsSubmittedAt() != null
                        || p.getVerificationStatus() != VerificationStatus.UNVERIFIED)
                .sorted((a, b) -> {
                    if (a.getDocumentsSubmittedAt() == null) return 1;
                    if (b.getDocumentsSubmittedAt() == null) return -1;
                    return a.getDocumentsSubmittedAt().compareTo(b.getDocumentsSubmittedAt());
                })
                .map(this::toVerificationResponse)
                .toList();
    }

    public AdminVerificationResponse getVerification(Long sellerProfileId) {
        return toVerificationResponse(findSellerOr404(sellerProfileId));
    }

    public AdminVerificationResponse approveVerification(Admin actor, Long sellerProfileId) {
        SellerProfile profile = findSellerOr404(sellerProfileId);

        if (profile.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only a shop awaiting review can be approved");
        }

        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setRejectionReason(null);
        sellerRepository.save(profile);

        auditLogService.record(actor, AuditAction.APPROVED_VERIFICATION, "VERIFICATION",
                profile.getId(), sellerNameOf(profile), null);

        // Nothing on the seller's screen changes until they open their
        // profile, so tell them rather than making them go and look.
        notificationService.send(profile.getUser(),
                "Your shop is verified",
                "Buyers will now see a verified badge on your shop and your listings.",
                NotificationType.ACCOUNT, profile.getId());

        return toVerificationResponse(profile);
    }

    public AdminVerificationResponse rejectVerification(
            Admin actor, Long sellerProfileId, String reason) {
        SellerProfile profile = findSellerOr404(sellerProfileId);

        if (profile.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only a shop awaiting review can be rejected");
        }
        // Without a reason the seller has no idea what to correct, and would
        // just resubmit the same documents.
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Give a reason so the seller knows what to fix");
        }

        profile.setVerificationStatus(VerificationStatus.REJECTED);
        profile.setRejectionReason(reason.strip());
        sellerRepository.save(profile);

        auditLogService.record(actor, AuditAction.REJECTED_VERIFICATION, "VERIFICATION",
                profile.getId(), sellerNameOf(profile), reason.strip());

        // The reason travels with the notification: a seller told only that
        // they failed would resubmit exactly the same documents.
        notificationService.send(profile.getUser(),
                "Verification not approved",
                reason.strip() + " You can fix this and submit again from your "
                        + "seller profile.",
                NotificationType.ACCOUNT, profile.getId());

        return toVerificationResponse(profile);
    }

    // ----------------------------------------------------------------- users

    public List<AdminUserResponse> listUsers() {
        return userRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .map(this::toUserResponse)
                .toList();
    }

    public AdminUserResponse setUserStatus(Admin actor, Long userId,
                                           AccountStatus status, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        user.setAccountStatus(status);
        userRepository.save(user);

        auditLogService.record(actor,
                status == AccountStatus.SUSPENDED
                        ? AuditAction.SUSPENDED_USER : AuditAction.REACTIVATED_USER,
                "USER", user.getId(), displayNameOf(user), reason);

        if (status == AccountStatus.SUSPENDED) {
            notificationService.send(user,
                    "Your account has been suspended",
                    (reason == null || reason.isBlank()
                            ? "Please contact ClearStock support."
                            : reason + " Please contact ClearStock support."),
                    NotificationType.ACCOUNT, user.getId());
        } else {
            notificationService.send(user,
                    "Your account is active again",
                    "You can sign in and trade on ClearStock as normal.",
                    NotificationType.ACCOUNT, user.getId());
        }

        return toUserResponse(user);
    }

    // -------------------------------------------------------------- listings

    public List<AdminListingResponse> listListings() {
        return listingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toListingResponse)
                .toList();
    }

    public AdminListingResponse getListing(Long listingId) {
        return toListingResponse(findListingOr404(listingId));
    }

    public AdminListingResponse setListingStatus(Admin actor, Long listingId,
                                                 ListingStatus status, String reason) {
        Listing listing = findListingOr404(listingId);

        if (status == ListingStatus.SUSPENDED && (reason == null || reason.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Give a reason for suspending this listing");
        }

        listing.setListingStatus(status);
        listingRepository.save(listing);

        AuditAction action = switch (status) {
            case SUSPENDED -> AuditAction.SUSPENDED_LISTING;
            case ARCHIVED -> AuditAction.ARCHIVED_LISTING;
            default -> AuditAction.RESTORED_LISTING;
        };
        auditLogService.record(actor, action, "LISTING",
                listing.getId(), listing.getProductName(), reason);

        // A seller whose listing vanishes without explanation assumes the app
        // is broken, so say what happened and why.
        if (listing.getSeller() != null && listing.getSeller().getUser() != null) {
            String title = switch (status) {
                case SUSPENDED -> "A listing was suspended";
                case ARCHIVED -> "A listing was archived";
                default -> "A listing was restored";
            };
            String body = status == ListingStatus.ACTIVE
                    ? "\"" + listing.getProductName() + "\" is visible to buyers again."
                    : "\"" + listing.getProductName() + "\" is no longer visible to buyers."
                            + (reason == null || reason.isBlank() ? "" : " Reason: " + reason);

            notificationService.send(listing.getSeller().getUser(), title, body,
                    NotificationType.ACCOUNT, listing.getId());
        }

        return toListingResponse(listing);
    }

    // --------------------------------------------------------------- reports

    public List<AdminReportResponse> listReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toReportResponse)
                .toList();
    }

    /**
     * One complaint plus its context. A moderator deciding whether to act
     * needs to know if this is a first complaint or the fifth, so other
     * reports about the same target come back with it.
     */
    public AdminReportDetailResponse getReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Report not found"));

        AdminReportResponse mapped = toReportResponse(report);

        List<AdminReportResponse> others = reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(other -> !other.getId().equals(report.getId()))
                .filter(other -> sameTarget(other, report))
                .map(this::toReportResponse)
                .toList();

        long openCount = others.stream()
                .filter(o -> o.getStatus() == ReportStatus.OPEN
                        || o.getStatus() == ReportStatus.REVIEWING)
                .count();

        return AdminReportDetailResponse.builder()
                .report(mapped)
                .reason(report.getReason())
                .otherReports(others)
                .otherOpenCount(openCount)
                .build();
    }

    /** Two reports share a target when they name the same listing or person. */
    private boolean sameTarget(Report a, Report b) {
        if (a.getReportType() != b.getReportType()) return false;
        if (a.getReportType() == ReportType.LISTING) {
            return a.getListing() != null && b.getListing() != null
                    && a.getListing().getId().equals(b.getListing().getId());
        }
        return a.getReportedUser() != null && b.getReportedUser() != null
                && a.getReportedUser().getId().equals(b.getReportedUser().getId());
    }

    public AdminReportResponse setReportStatus(Admin actor, Long reportId,
                                               ReportStatus status, String note) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Report not found"));

        report.setStatus(status);
        reportRepository.save(report);

        auditLogService.record(actor,
                status == ReportStatus.DISMISSED
                        ? AuditAction.DISMISSED_REPORT : AuditAction.ACTIONED_REPORT,
                "REPORT", report.getId(), targetLabelOf(report), note);

        return toReportResponse(report);
    }

    // ---------------------------------------------------------- payments

    /**
     * Every payment, plus the escrow totals.
     *
     * ClearStock holds a buyer's money until they confirm collection, so
     * "paid" and "the seller has it" are different states — this is where an
     * admin can see which is which, and answer a seller asking where their
     * money is.
     */
    public AdminPaymentsResponse getPayments() {
        List<Transaction> all = transactionRepository.findAllByOrderByCreatedAtDesc();

        List<AdminTransactionResponse> mapped = all.stream()
                .map(this::toTransactionResponse)
                .toList();

        BigDecimal held = sumWhere(mapped, "HELD");
        BigDecimal released = sumWhere(mapped, "RELEASED");
        BigDecimal gross = held.add(released).setScale(2, RoundingMode.HALF_UP);
        BigDecimal commission = commissionOn(gross);

        return AdminPaymentsResponse.builder()
                .commissionRate(SellerService.COMMISSION_RATE_PERCENT)
                .heldTotal(held)
                .heldCount((int) mapped.stream().filter(t -> "HELD".equals(t.getEscrowState())).count())
                .releasedTotal(released)
                .releasedCount((int) mapped.stream().filter(t -> "RELEASED".equals(t.getEscrowState())).count())
                .grossTotal(gross)
                .commissionTotal(commission)
                .netToSellersTotal(gross.subtract(commission).setScale(2, RoundingMode.HALF_UP))
                .transactions(mapped)
                .build();
    }

    private BigDecimal sumWhere(List<AdminTransactionResponse> rows, String state) {
        return rows.stream()
                .filter(t -> state.equals(t.getEscrowState()))
                .map(AdminTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal commissionOn(BigDecimal gross) {
        return gross.multiply(SellerService.COMMISSION_RATE_PERCENT)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private AdminTransactionResponse toTransactionResponse(Transaction tx) {
        BigDecimal amount = tx.getListing() == null || tx.getListing().getCurrentPrice() == null
                ? BigDecimal.ZERO
                : tx.getListing().getCurrentPrice()
                        .multiply(BigDecimal.valueOf(tx.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP);

        String escrow;
        if (tx.getTransactionStatus() == TransactionStatus.CANCELLED) {
            escrow = "CANCELLED";
        } else if (tx.getPaymentStatus() != PaymentStatus.PAYMENT_SUCCESSFUL) {
            escrow = "UNPAID";
        } else if (tx.getTransactionStatus() == TransactionStatus.COMPLETED) {
            escrow = "RELEASED";
        } else {
            escrow = "HELD";
        }

        BigDecimal commission = "CANCELLED".equals(escrow) || "UNPAID".equals(escrow)
                ? BigDecimal.ZERO.setScale(2)
                : commissionOn(amount);

        return AdminTransactionResponse.builder()
                .id(tx.getId())
                .listingTitle(tx.getListing() == null ? "—" : tx.getListing().getProductName())
                .buyerName(tx.getBuyer() == null ? "—" : displayNameOf(tx.getBuyer()))
                .sellerName(tx.getSeller() == null ? "—" : displayNameOf(tx.getSeller()))
                .quantity(tx.getQuantity())
                .amount(amount)
                .commission(commission)
                .netToSeller(amount.subtract(commission).setScale(2, RoundingMode.HALF_UP))
                .paymentStatus(tx.getPaymentStatus())
                .transactionStatus(tx.getTransactionStatus())
                .escrowState(escrow)
                .paymentReference(tx.getPaymentReference())
                .createdAt(tx.getCreatedAt())
                .completedAt(tx.getCompletedAt())
                .build();
    }

    // ----------------------------------------------------------- reviews

    public List<AdminReviewResponse> listReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(review -> AdminReviewResponse.builder()
                        .id(review.getId())
                        .rating(review.getRating())
                        .comment(review.getComment())
                        .reviewerName(displayNameOf(review.getReviewer()))
                        .revieweeName(displayNameOf(review.getReviewee()))
                        .revieweeUserId(review.getReviewee().getId())
                        .listingTitle(review.getTransaction() == null
                                || review.getTransaction().getListing() == null
                                ? "—"
                                : review.getTransaction().getListing().getProductName())
                        .createdAt(review.getCreatedAt())
                        .build())
                .toList();
    }

    // ------------------------------------------------------------ audit logs

    public List<AuditLogResponse> listAuditLogs() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(log -> AuditLogResponse.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .adminName(log.getAdmin().getName())
                        .adminId(log.getAdmin().getId())
                        .targetType(log.getTargetType())
                        .targetId(log.getTargetId())
                        .targetLabel(log.getTargetLabel())
                        .note(log.getNote())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();
    }

    // --------------------------------------------------------------- mapping

    private SellerProfile findSellerOr404(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Seller profile not found"));
    }

    private Listing findListingOr404(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));
    }

    /** The shop name where there is one, otherwise the person's own name. */
    private String sellerNameOf(SellerProfile profile) {
        String business = profile.getBusinessName();
        return business != null && !business.isBlank()
                ? business : profile.getUser().getName();
    }

    private AdminVerificationResponse toVerificationResponse(SellerProfile profile) {
        User user = profile.getUser();
        return AdminVerificationResponse.builder()
                .sellerProfileId(profile.getId())
                .userId(user.getId())
                .sellerName(user.getName())
                .businessName(profile.getBusinessName())
                .sellerType(profile.getSellerType() == null
                        ? null : profile.getSellerType().name())
                .region(user.getRegion())
                .cityTown(user.getCityTown())
                .marketHub(profile.getMarketHub())
                .businessDescription(profile.getBusinessDescription())
                .ghanaCardNumber(profile.getGhanaCardNumber())
                .ghanaCardPhotoUrl(profile.getGhanaCardPhotoUrl())
                .businessRegUrl(profile.getBusinessRegUrl())
                .verificationStatus(profile.getVerificationStatus())
                .rejectionReason(profile.getRejectionReason())
                .documentsSubmittedAt(profile.getDocumentsSubmittedAt())
                .build();
    }

    private AdminUserResponse toUserResponse(User user) {
        boolean isSeller = sellerRepository.findByUser(user).isPresent();
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(displayNameOf(user))
                .phone(user.getPhone())
                .email(user.getEmail())
                .region(user.getRegion())
                .cityTown(user.getCityTown())
                .role(isSeller ? "SELLER" : "BUYER")
                // Rows created before this column existed are null, which
                // means active.
                .accountStatus(user.getAccountStatus() == null
                        ? AccountStatus.ACTIVE : user.getAccountStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminListingResponse toListingResponse(Listing listing) {
        SellerProfile seller = listing.getSeller();
        return AdminListingResponse.builder()
                .id(listing.getId())
                .title(listing.getProductName())
                .description(listing.getDescription())
                .category(listing.getCategory())
                .sellerName(seller == null ? null : sellerNameOf(seller))
                .sellerUserId(seller == null ? null : seller.getUser().getId())
                .originalPrice(listing.getOriginalPrice())
                .currentPrice(listing.getCurrentPrice())
                .quantity(listing.getQuantity())
                .unit(listing.getUnitOfMeasurement())
                .listingStatus(listing.getListingStatus())
                .expiryDate(listing.getExpiryDate())
                .clearanceEndDate(listing.getClearanceEndDate())
                .minimumAcceptablePrice(listing.getMinimumAcceptablePrice())
                .expirySensitive(listing.isExpirySensitive())
                .imageUrls(listing.getImages())
                .createdAt(listing.getCreatedAt())
                .build();
    }

    /** What the complaint is about, as the dashboard's "Reported" column. */
    private String targetLabelOf(Report report) {
        if (report.getReportType() == ReportType.LISTING && report.getListing() != null) {
            return report.getListing().getProductName();
        }
        if (report.getReportedUser() != null) {
            return displayNameOf(report.getReportedUser());
        }
        return "Unknown";
    }

    /**
     * A person's shop name if they trade under one, otherwise their own name.
     * Accounts created before profile setup have their phone number as their
     * name, which is why the phone is the last resort rather than the first.
     */
    private String displayNameOf(User user) {
        String shop = sellerRepository.findByUser(user)
                .map(SellerProfile::getBusinessName)
                .filter(businessName -> businessName != null && !businessName.isBlank())
                .orElse(null);
        if (shop != null) return shop;

        String name = user.getName();
        return name == null || name.isBlank() ? user.getPhone() : name;
    }

    private AdminReportResponse toReportResponse(Report report) {
        boolean isListing = report.getReportType() == ReportType.LISTING;

        String targetType;
        Long targetId;
        if (isListing) {
            targetType = "LISTING";
            targetId = report.getListing() == null ? null : report.getListing().getId();
        } else {
            // A reported person is shown as a seller or a buyer depending on
            // whether they run a shop — that is what a moderator needs to know.
            User reported = report.getReportedUser();
            boolean isSeller = reported != null
                    && sellerRepository.findByUser(reported).isPresent();
            targetType = isSeller ? "SELLER" : "BUYER";
            targetId = reported == null ? null : reported.getId();
        }

        return AdminReportResponse.builder()
                .id(report.getId())
                .targetType(targetType)
                .targetLabel(targetLabelOf(report))
                .targetId(targetId)
                // Complaints filed before categories existed have only free
                // text; showing the whole complaint in a Category column read
                // as duplicated content, so they fall back to "Other".
                .category(report.getCategory() == null || report.getCategory().isBlank()
                        ? "Other" : report.getCategory())
                .reporterName(displayNameOf(report.getReporter()))
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
