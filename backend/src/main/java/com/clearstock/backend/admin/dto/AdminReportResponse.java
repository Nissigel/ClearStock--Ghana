package com.clearstock.backend.admin.dto;

import com.clearstock.backend.reports.ReportStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminReportResponse {
    private Long id;
    /** SELLER, BUYER, LISTING or REVIEW — what the complaint is about. */
    private String targetType;
    private String targetLabel;
    private Long targetId;
    private String category;
    private String reporterName;
    private ReportStatus status;
    private LocalDateTime createdAt;
}
