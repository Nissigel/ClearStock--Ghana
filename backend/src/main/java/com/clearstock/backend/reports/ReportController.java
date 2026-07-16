package com.clearstock.backend.reports;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.reports.dto.CreateReportRequest;
import com.clearstock.backend.reports.dto.ReportResponse;
import com.clearstock.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            Authentication authentication,
            @RequestBody @Valid CreateReportRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report submitted", reportService.createReport(user, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportResponse>>> getMyReports(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(reportService.getMyReports(user)));
    }
}
