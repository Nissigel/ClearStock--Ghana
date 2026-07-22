package com.clearstock.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

/** The numbers on the dashboard's stat cards. */
@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalSellers;
    private long verifiedSellers;
    private long pendingVerifications;
    private long totalListings;
    private long activeListings;
    private long archivedListings;
    private long suspendedListings;
    private long openReports;
    private long purchaseRequests;
    private long completedTransactions;
}
