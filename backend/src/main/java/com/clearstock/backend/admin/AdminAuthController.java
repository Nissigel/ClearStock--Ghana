package com.clearstock.backend.admin;

import com.clearstock.backend.admin.dto.AdminLoginRequest;
import com.clearstock.backend.admin.dto.AdminLoginResponse;
import com.clearstock.backend.admin.dto.AdminResponse;
import com.clearstock.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminLoginResponse>> login(
            @RequestBody @Valid AdminLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Signed in", adminAuthService.login(request)));
    }

    /**
     * Who the current token belongs to. The dashboard calls this on load to
     * decide whether a stored token is still good, rather than trusting
     * whatever it cached about the signed-in admin.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminResponse>> me(Authentication authentication) {
        Admin admin = (Admin) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(AdminResponse.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role(admin.getRole())
                .active(admin.getActive())
                .lastLoginAt(admin.getLastLoginAt())
                .createdAt(admin.getCreatedAt())
                .build()));
    }
}
