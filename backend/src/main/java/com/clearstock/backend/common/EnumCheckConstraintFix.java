package com.clearstock.backend.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Drops the CHECK constraints Hibernate writes on {@code @Enumerated(STRING)}
 * columns.
 *
 * Hibernate 6 (which Spring Boot 3 uses) emits, for each such column, a CHECK
 * listing the enum's values as they stood when the table was first created.
 * Running with {@code ddl-auto=update} it never revisits that constraint — so
 * adding a constant to an enum later (for example {@code NotificationType
 * .ACCOUNT} or {@code ListingStatus.SUSPENDED}) makes any insert or update
 * carrying the new value fail the stale CHECK, which the API then surfaces as a
 * bare 500, "An unexpected error occurred".
 *
 * That is exactly what stopped the admin dashboard archiving a listing: every
 * moderation action notifies the seller with a {@code NotificationType.ACCOUNT}
 * row, a value added after the notifications table already existed, so the
 * notification insert broke the whole request. Suspending a listing hit the
 * same wall through {@code ListingStatus.SUSPENDED}.
 *
 * The application only ever writes valid enum names, so these database-level
 * guards are redundant; dropping them lets the enums keep growing without a
 * hand-written migration each time. Runs on startup and is safe to repeat: a
 * constraint that is already gone simply isn't found.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EnumCheckConstraintFix implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    /** {table, column} for every enum-backed column, so none is left behind. */
    private static final String[][] ENUM_COLUMNS = {
            {"listings", "listing_status"},
            {"notifications", "type"},
            {"users", "account_status"},
            {"seller_profiles", "verification_status"},
            {"seller_profiles", "seller_type"},
            {"purchase_requests", "status"},
            {"transactions", "payment_status"},
            {"transactions", "transaction_status"},
            {"transactions", "fulfillment_method"},
            {"conversations", "status"},
            {"user_reports", "report_type"},
            {"user_reports", "status"},
            {"otp_records", "purpose"},
            {"admins", "role"},
            {"admin_audit_logs", "action"},
    };

    @Override
    public void run(ApplicationArguments args) {
        for (String[] pair : ENUM_COLUMNS) {
            dropCheckConstraints(pair[0], pair[1]);
        }
    }

    private void dropCheckConstraints(String table, String column) {
        try {
            // Look the constraint up by the column it guards rather than by a
            // guessed name, since Hibernate lets Postgres auto-name it.
            List<String> constraints = jdbcTemplate.queryForList(
                    "SELECT c.conname FROM pg_constraint c "
                            + "JOIN pg_attribute a ON a.attrelid = c.conrelid "
                            + "AND a.attnum = ANY (c.conkey) "
                            + "WHERE c.contype = 'c' "
                            + "AND c.conrelid = to_regclass(?) "
                            + "AND a.attname::text = ?",
                    String.class, table, column);

            for (String constraint : constraints) {
                jdbcTemplate.execute("ALTER TABLE " + table
                        + " DROP CONSTRAINT IF EXISTS \"" + constraint + "\"");
                log.info("Dropped stale enum CHECK constraint {} on {}.{}",
                        constraint, table, column);
            }
        } catch (Exception e) {
            // A missing table or a permissions quirk here shouldn't stop the app
            // booting; the constraint just stays until the next boot.
            log.warn("Could not drop enum CHECK constraints on {}.{}: {}",
                    table, column, e.getMessage());
        }
    }
}
