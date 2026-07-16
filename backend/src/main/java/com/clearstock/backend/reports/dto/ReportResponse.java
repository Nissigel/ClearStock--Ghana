package com.clearstock.backend.reports.dto;

import com.clearstock.backend.reports.Report;
import com.clearstock.backend.reports.ReportStatus;
import com.clearstock.backend.reports.ReportType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {

    private Long id;
    private ReportType reportType;
    private Long targetId;
    /** Human-readable label for what was reported (product or person). */
    private String targetLabel;
    private String reason;
    private ReportStatus status;
    private LocalDateTime createdAt;

    public static ReportResponse from(Report report) {
        boolean isListing = report.getReportType() == ReportType.LISTING;

        Long targetId = isListing
                ? (report.getListing() != null ? report.getListing().getId() : null)
                : (report.getReportedUser() != null ? report.getReportedUser().getId() : null);

        String targetLabel;
        if (isListing) {
            targetLabel = report.getListing() != null
                    ? report.getListing().getProductName()
                    : "Deleted listing";
        } else {
            targetLabel = report.getReportedUser() != null
                    ? report.getReportedUser().getName()
                    : "Deleted user";
        }

        return ReportResponse.builder()
                .id(report.getId())
                .reportType(report.getReportType())
                .targetId(targetId)
                .targetLabel(targetLabel)
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
