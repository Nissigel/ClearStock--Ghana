package com.clearstock.backend.listings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Relaxes NOT NULL constraints the live database still carries on columns the
 * entity treats as optional.
 *
 * These columns were created NOT NULL by an earlier version of the schema.
 * {@code ddl-auto=update} adds columns but never relaxes existing ones, so a
 * listing saved without them — which is exactly what happens when the seller
 * turns auto-discount off, leaving the step, interval and clearance date empty
 * — failed the insert and surfaced as a 500.
 *
 * Each statement runs on its own and is safe to repeat: dropping a NOT NULL
 * that is already dropped is a no-op in Postgres.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ListingSchemaFix implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final String[] OPTIONAL_COLUMNS = {
            "discount_step_percent",
            "discount_interval_days",
            "clearance_end_date",
    };

    @Override
    public void run(ApplicationArguments args) {
        for (String column : OPTIONAL_COLUMNS) {
            try {
                jdbcTemplate.execute(
                        "ALTER TABLE listings ALTER COLUMN " + column + " DROP NOT NULL");
            } catch (Exception e) {
                // A missing table or column here shouldn't stop the app booting.
                log.warn("Could not relax NOT NULL on listings.{}: {}", column, e.getMessage());
            }
        }
    }
}
