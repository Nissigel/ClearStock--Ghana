package com.clearstock.backend.admin;

import com.clearstock.backend.admin.dto.AdminLoginRequest;
import com.clearstock.backend.admin.dto.ChangePasswordRequest;
import com.clearstock.backend.admin.dto.AdminLoginResponse;
import com.clearstock.backend.admin.dto.AdminResponse;
import com.clearstock.backend.admin.dto.CreateAdminRequest;
import com.clearstock.backend.common.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    public AdminLoginResponse login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByEmailIgnoreCase(request.getEmail().strip())
                .orElse(null);

        // Same message whether the email is unknown or the password is wrong,
        // so this cannot be used to discover which staff emails exist.
        if (admin == null
                || !passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Incorrect email or password");
        }

        if (!Boolean.TRUE.equals(admin.getActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This admin account has been disabled");
        }

        admin.setLastLoginAt(LocalDateTime.now());
        adminRepository.save(admin);

        return AdminLoginResponse.builder()
                .token(jwtUtil.generateAdminToken(
                        admin.getId(), admin.getEmail(), admin.getRole().name()))
                .admin(toResponse(admin))
                .build();
    }

    /**
     * Changes the signed-in admin's own password. The current password is
     * required, so a walk-up to an unlocked screen cannot lock the owner out
     * of their own account.
     */
    public void changeOwnPassword(Admin actor, ChangePasswordRequest request) {
        Admin admin = adminRepository.findById(actor.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Admin not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Your current password is incorrect");
        }

        admin.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
    }

    public List<AdminResponse> listAdmins() {
        return adminRepository.findAllByOrderByCreatedAtAsc()
                .stream().map(this::toResponse).toList();
    }

    public AdminResponse createAdmin(Admin actor, CreateAdminRequest request) {
        String email = request.getEmail().strip().toLowerCase();

        if (adminRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An admin with that email already exists");
        }

        Admin created = adminRepository.save(Admin.builder()
                .email(email)
                .name(request.getName().strip())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() == null ? AdminRole.ADMIN : request.getRole())
                .active(true)
                .build());

        auditLogService.record(actor, AuditAction.CREATED_ADMIN, "ADMIN",
                created.getId(), created.getName(), null);

        return toResponse(created);
    }

    public AdminResponse setActive(Admin actor, Long adminId, boolean active) {
        Admin target = findOr404(adminId);

        // Without this the last super admin could disable themselves and leave
        // nobody able to manage staff accounts.
        if (target.getRole() == AdminRole.SUPER_ADMIN && !active) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The super admin account cannot be disabled");
        }

        target.setActive(active);
        adminRepository.save(target);

        auditLogService.record(actor,
                active ? AuditAction.ENABLED_ADMIN : AuditAction.DISABLED_ADMIN,
                "ADMIN", target.getId(), target.getName(), null);

        return toResponse(target);
    }

    public AdminResponse changeRole(Admin actor, Long adminId, AdminRole role) {
        Admin target = findOr404(adminId);

        if (target.getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot change your own role");
        }

        target.setRole(role);
        adminRepository.save(target);

        auditLogService.record(actor, AuditAction.CHANGED_ADMIN_ROLE, "ADMIN",
                target.getId(), target.getName(), "Role set to " + role.name());

        return toResponse(target);
    }

    private Admin findOr404(Long adminId) {
        return adminRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Admin not found"));
    }

    private AdminResponse toResponse(Admin admin) {
        return AdminResponse.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role(admin.getRole())
                .active(admin.getActive())
                .lastLoginAt(admin.getLastLoginAt())
                .createdAt(admin.getCreatedAt())
                .build();
    }
}
