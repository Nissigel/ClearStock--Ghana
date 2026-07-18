package com.clearstock.backend.reports;

import com.clearstock.backend.listings.Listing;
import com.clearstock.backend.listings.ListingRepository;
import com.clearstock.backend.reports.dto.CreateReportRequest;
import com.clearstock.backend.reports.dto.ReportResponse;
import com.clearstock.backend.user.User;
import com.clearstock.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    @Transactional
    public ReportResponse createReport(User reporter, CreateReportRequest request) {
        Report.ReportBuilder builder = Report.builder()
                .reporter(reporter)
                .reportType(request.getReportType())
                .reason(request.getReason().strip())
                .category(request.getCategory())
                .status(ReportStatus.OPEN);

        if (request.getReportType() == ReportType.LISTING) {
            Listing listing = listingRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
            builder.listing(listing);
        } else {
            User reported = userRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            if (reported.getId().equals(reporter.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot report yourself");
            }
            builder.reportedUser(reported);
        }

        return ReportResponse.from(reportRepository.save(builder.build()));
    }

    /** Complaints this user has submitted. */
    public List<ReportResponse> getMyReports(User reporter) {
        return reportRepository.findByReporterOrderByCreatedAtDesc(reporter)
                .stream().map(ReportResponse::from).collect(Collectors.toList());
    }
}
