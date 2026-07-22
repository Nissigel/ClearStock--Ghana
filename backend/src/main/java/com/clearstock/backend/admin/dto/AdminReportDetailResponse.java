package com.clearstock.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * A single complaint with the context needed to judge it: what was said, who
 * said it, and whether this target has been reported before.
 */
@Data
@Builder
public class AdminReportDetailResponse {
    private AdminReportResponse report;
    /** The full text the reporter wrote. */
    private String reason;
    /** Other complaints about the same seller, buyer or listing. */
    private List<AdminReportResponse> otherReports;
    private long otherOpenCount;
}
