package com.clearstock.backend.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

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

    private static final Pattern LOOKS_LIKE_EMAIL =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.super.email:}")
    private String email;

    @Value("${admin.super.password:}")
    private String password;

    @Value("${admin.super.name:Super Admin}")
    private String name;

    /**
     * An escape hatch for a forgotten password. Off by default, because a
     * seeder that silently rewrote credentials on every boot would mean an
     * environment variable could take over a live account.
     */
    @Value("${admin.super.reset:false}")
    private boolean reset;

    @Override
    public void run(ApplicationArguments args) {
        // Always report the state. Returning silently when an account already
        // existed made "no super admin log line" ambiguous between "already
        // set up" and "never ran", which is the one question this needs to
        // answer when somebody cannot sign in.
        long admins = adminRepository.count();
        log.info("[super admin] admin accounts in database: {}. SUPER_ADMIN_EMAIL is {}.",
                admins, (email == null || email.isBlank()) ? "NOT set" : "set");

        // It is easy to paste the description of a variable instead of its
        // value, which then seeds an account nobody can sign in to and looks
        // exactly like a wrong password. Say so loudly rather than accept it.
        if (email != null && !email.isBlank() && !LOOKS_LIKE_EMAIL.matcher(email.strip()).matches()) {
            log.error("[super admin] SUPER_ADMIN_EMAIL is \"{}\", which is not an email "
                    + "address. Set it to the actual address you will sign in with.", email);
        }

        Admin existing = adminRepository.findAllByOrderByCreatedAtAsc().stream()
                .filter(a -> a.getRole() == AdminRole.SUPER_ADMIN)
                .findFirst()
                .orElse(null);

        if (existing != null) {
            // The email is logged because signing in with the wrong one looks
            // identical to a wrong password, and only the account owner can
            // read these logs.
            log.info("[super admin] one already exists: {}", existing.getEmail());

            if (!reset) {
                log.info("[super admin] leaving it untouched. If you cannot sign in, set "
                        + "SUPER_ADMIN_RESET=true and redeploy to reset its password from "
                        + "SUPER_ADMIN_PASSWORD.");
                return;
            }

            if (password == null || password.isBlank()) {
                log.warn("[super admin] SUPER_ADMIN_RESET is set but SUPER_ADMIN_PASSWORD "
                        + "is empty — nothing to reset it to.");
                return;
            }

            existing.setPasswordHash(passwordEncoder.encode(password));
            if (email != null && !email.isBlank()) {
                existing.setEmail(email.strip().toLowerCase());
            }
            if (name != null && !name.isBlank()) {
                existing.setName(name);
            }
            existing.setActive(true);
            adminRepository.save(existing);

            log.warn("[super admin] password reset for {}. Remove SUPER_ADMIN_RESET from the "
                    + "environment now — leaving it on resets the password on every restart.",
                    existing.getEmail());
            return;
        }

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("[super admin] no super admin exists and SUPER_ADMIN_EMAIL/"
                    + "SUPER_ADMIN_PASSWORD are not set. The admin dashboard cannot be "
                    + "signed into until they are.");
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

        log.info("[super admin] created {} — sign in with this email and the password "
                + "you set in SUPER_ADMIN_PASSWORD.", email);
    }
}
