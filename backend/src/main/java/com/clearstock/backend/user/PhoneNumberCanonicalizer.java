package com.clearstock.backend.user;

import com.clearstock.backend.common.PhoneUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Brings accounts saved before {@link PhoneUtil} existed onto the canonical
 * "0XXXXXXXXX" form.
 *
 * Numbers used to be stored exactly as typed, so the same person could be saved
 * as "596829238" from the sign-up screen and then looked up as "0596829238"
 * from login and never be found. Now that every lookup is normalized, rows in
 * the old shape would be permanently unreachable — so rewrite them once.
 *
 * Runs on every boot but only touches rows that aren't already canonical, so
 * it's a no-op once the data is clean.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PhoneNumberCanonicalizer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int updated = 0;
        int skipped = 0;

        for (User user : userRepository.findAll()) {
            String canonical = PhoneUtil.normalize(user.getPhone());
            if (canonical == null || canonical.equals(user.getPhone())) {
                continue;
            }

            // Both spellings of one number can exist as separate accounts. The
            // canonical row is the one login already reaches, so leave the pair
            // alone rather than collide with the unique constraint.
            if (userRepository.existsByPhone(canonical)) {
                log.warn("Leaving user {} on legacy phone {} — {} is already taken",
                        user.getId(), user.getPhone(), canonical);
                skipped++;
                continue;
            }

            user.setPhone(canonical);
            user.setPhoneAlt(canonical);
            userRepository.save(user);
            updated++;
        }

        if (updated > 0 || skipped > 0) {
            log.info("Phone canonicalization: {} updated, {} skipped", updated, skipped);
        }
    }
}
