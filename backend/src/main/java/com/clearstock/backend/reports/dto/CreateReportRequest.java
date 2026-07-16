package com.clearstock.backend.reports.dto;

import com.clearstock.backend.reports.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReportRequest {

    @NotNull(message = "Report type is required")
    private ReportType reportType;

    /** Listing id for LISTING reports, user id for USER reports. */
    @NotNull(message = "Target is required")
    private Long targetId;

    @NotBlank(message = "Please describe the problem")
    @Size(max = 2000, message = "Reason is too long")
    private String reason;
}
