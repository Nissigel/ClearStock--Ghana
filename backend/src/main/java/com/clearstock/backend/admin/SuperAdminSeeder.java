package com.clearstock.backend.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first super admin on boot, from environment variables.
 *
 * The alternative — inserting a row by hand — puts a password into a SQL
 * script or somebody's terminal history. This way the only place the password
 * exists is the deployment environment, and nobody working on the code ever
 * sees it.
 *
 * Runs once: if any super admin already exists this does nothing, so it is
 * safe on every restart. It never updates an existing account, so changing the
 * environment variable later will not silently reset somebody's password.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuperAdminSeeder implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.super.email:}")
    private String email;

    @Value("${admin.super.password:}")
    private String password;

    @Value("${admin.super.name:Super Admin}")
    private String name;

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.existsByRole(AdminRole.SUPER_ADMIN)) {
            return;
        }

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("No super admin exists and SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD are not set. "
                    + "The admin dashboard cannot be signed into until they are.");
            return;
        }

        if (adminRepository.existsByEmailIgnoreCase(email)) {
            log.warn("Cannot seed super admin: {} is already an admin account.", email);
            return;
        }

        adminRepository.save(Admin.builder()
                .email(email.strip().toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .name(name)
                .role(AdminRole.SUPER_ADMIN)
                .active(true)
                .build());

        log.info("Seeded super admin {}", email);
    }
}
