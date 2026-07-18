package com.clearstock.backend.admin;

import com.clearstock.backend.admin.dto.*;
import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.listings.ListingStatus;
import com.clearstock.backend.reports.ReportStatus;
import com.clearstock.backend.seller.VerificationStatus;
import com.clearstock.backend.user.AccountStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AdminAuthService adminAuthService;

    private Admin actor(Authentication authentication) {
        return (Admin) authentication.getPrincipal();
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> stats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats()));
    }

    // -------------------------------------------------------- verifications

    @GetMapping("/verifications")
    public ResponseEntity<ApiResponse<List<AdminVerificationResponse>>> verifications(
            @RequestParam(required = false) VerificationStatus status) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listVerifications(status)));
    }

    @GetMapping("/verifications/{id}")
    public ResponseEntity<ApiResponse<AdminVerificationResponse>> verification(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getVerification(id)));
    }

    @PutMapping("/verifications/{id}/approve")
    public ResponseEntity<ApiResponse<AdminVerificationResponse>> approve(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Seller verified",
                adminService.approveVerification(actor(authentication), id)));
    }

    @PutMapping("/verifications/{id}/reject")
    public ResponseEntity<ApiResponse<AdminVerificationResponse>> reject(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Application rejected",
                adminService.rejectVerification(
                        actor(authentication), id, request.getReason())));
    }

    // ---------------------------------------------------------------- users

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> users() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listUsers()));
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<ApiResponse<AdminUserResponse>> suspendUser(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User suspended",
                adminService.setUserStatus(actor(authentication), id,
                        AccountStatus.SUSPENDED, request.getReason())));
    }

    @PutMapping("/users/{id}/reactivate")
    public ResponseEntity<ApiResponse<AdminUserResponse>> reactivateUser(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User reactivated",
                adminService.setUserStatus(actor(authentication), id,
                        AccountStatus.ACTIVE, null)));
    }

    // ------------------------------------------------------------- listings

    @GetMapping("/listings")
    public ResponseEntity<ApiResponse<List<AdminListingResponse>>> listings() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listListings()));
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<AdminListingResponse>> listing(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getListing(id)));
    }

    @PutMapping("/listings/{id}/suspend")
    public ResponseEntity<ApiResponse<AdminListingResponse>> suspendListing(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Listing suspended",
                adminService.setListingStatus(actor(authentication), id,
                        ListingStatus.SUSPENDED, request.getReason())));
    }

    @PutMapping("/listings/{id}/archive")
    public ResponseEntity<ApiResponse<AdminListingResponse>> archiveListing(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Listing archived",
                adminService.setListingStatus(actor(authentication), id,
                        ListingStatus.ARCHIVED, request.getReason())));
    }

    @PutMapping("/listings/{id}/restore")
    public ResponseEntity<ApiResponse<AdminListingResponse>> restoreListing(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Listing restored",
                adminService.setListingStatus(actor(authentication), id,
                        ListingStatus.ACTIVE, null)));
    }

    // -------------------------------------------------------------- reports

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<AdminReportResponse>>> reports() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listReports()));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<AdminReportDetailResponse>> report(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getReport(id)));
    }

    @PutMapping("/reports/{id}/action")
    public ResponseEntity<ApiResponse<AdminReportResponse>> actionReport(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Report actioned",
                adminService.setReportStatus(actor(authentication), id,
                        ReportStatus.RESOLVED, request.getNote())));
    }

    @PutMapping("/reports/{id}/dismiss")
    public ResponseEntity<ApiResponse<AdminReportResponse>> dismissReport(
            Authentication authentication, @PathVariable Long id,
            @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Report dismissed",
                adminService.setReportStatus(actor(authentication), id,
                        ReportStatus.DISMISSED, request.getNote())));
    }

    // ----------------------------------------------------------- audit logs

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> auditLogs() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listAuditLogs()));
    }

    // --------------------------------------------------- admins (super only)
    // Restricted to SUPER_ADMIN by SecurityConfig's /admin/admins/** rule.

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<AdminResponse>>> admins() {
        return ResponseEntity.ok(ApiResponse.success(adminAuthService.listAdmins()));
    }

    @PostMapping("/admins")
    public ResponseEntity<ApiResponse<AdminResponse>> createAdmin(
            Authentication authentication, @RequestBody @Valid CreateAdminRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Admin created",
                adminAuthService.createAdmin(actor(authentication), request)));
    }

    @PutMapping("/admins/{id}/disable")
    public ResponseEntity<ApiResponse<AdminResponse>> disableAdmin(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Admin disabled",
                adminAuthService.setActive(actor(authentication), id, false)));
    }

    @PutMapping("/admins/{id}/enable")
    public ResponseEntity<ApiResponse<AdminResponse>> enableAdmin(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Admin enabled",
                adminAuthService.setActive(actor(authentication), id, true)));
    }

    @PutMapping("/admins/{id}/role")
    public ResponseEntity<ApiResponse<AdminResponse>> changeAdminRole(
            Authentication authentication, @PathVariable Long id,
            @RequestParam AdminRole role) {
        return ResponseEntity.ok(ApiResponse.success("Role updated",
                adminAuthService.changeRole(actor(authentication), id, role)));
    }
}
