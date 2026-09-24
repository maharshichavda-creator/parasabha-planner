package com.parasabha.planner.seed;

import java.sql.Array;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Drops stale UNIQUE constraints left behind on the {@code mandal} table by earlier schema
 * revisions.
 *
 * <p>{@code spring.jpa.hibernate.ddl-auto=update} only ever ADDS schema elements: when the
 * mandal uniqueness rule changed from {@code (name, is_prs)} to
 * {@code (name, is_prs, is_yuvak)} (to support the Yuvak Mandal category), Hibernate added the
 * new 3-column constraint but never dropped the old 2-column one(s). Those stale constraints
 * then incorrectly keep rejecting the very thing the new column was meant to allow -
 * re-adding a mandal under a new category (e.g. Yuvak) with the same name as an existing
 * regular/PRS mandal - producing a raw {@code DataIntegrityViolationException} that isn't
 * handled by {@link com.parasabha.planner.exception.GlobalExceptionHandler}.
 *
 * <p>Runs before {@link ScheduleDataSeeder} on every startup; it's a no-op once the stale
 * constraints are gone, so it's safe to leave in place permanently.
 */
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MandalConstraintCleanup implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MandalConstraintCleanup.class);
    private static final Set<String> CURRENT_UNIQUE_COLUMNS = Set.of("name", "is_prs", "is_yuvak");

    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        String findUniqueConstraintsSql = """
                SELECT con.conname AS constraint_name, array_agg(att.attname ORDER BY att.attnum) AS columns
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN unnest(con.conkey) AS k(attnum) ON true
                JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
                WHERE rel.relname = 'mandal' AND con.contype = 'u'
                GROUP BY con.conname
                """;

        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet rs = statement.executeQuery(findUniqueConstraintsSql)) {
            while (rs.next()) {
                String constraintName = rs.getString("constraint_name");
                Array columnsArray = rs.getArray("columns");
                Set<String> columns = new LinkedHashSet<>(Arrays.asList((String[]) columnsArray.getArray()));
                if (!columns.equals(CURRENT_UNIQUE_COLUMNS)) {
                    log.info("Dropping stale unique constraint '{}' on mandal{} - superseded by the "
                            + "current (name, is_prs, is_yuvak) rule", constraintName, columns);
                    try (Statement drop = connection.createStatement()) {
                        drop.execute("ALTER TABLE mandal DROP CONSTRAINT \"" + constraintName + "\"");
                    }
                }
            }
        } catch (Exception ex) {
            // Never block application startup over cleanup of a legacy constraint.
            log.warn("Could not clean up stale mandal unique constraints", ex);
        }
    }
}
