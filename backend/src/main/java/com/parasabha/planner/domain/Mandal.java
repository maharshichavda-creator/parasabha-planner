package com.parasabha.planner.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.ColumnDefault;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A local Mandal (satsang group/venue) that hosts a Parasabha on a given weekday.
 * Names must be unique among mandals of the same category (regular vs. PRS) — a mandal can
 * be re-added under the PRS category with the same name as an existing regular mandal.
 */
@Entity
@Table(name = "mandal", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "is_prs"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mandal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** True when the mandal is marked as a "PR" (Pramukh/priority) location in the source schedule. */
    @Column(name = "is_pr", nullable = false)
    @ColumnDefault("false")
    @Builder.Default
    private boolean pr = false;

    /**
     * True when the mandal belongs to the special "PRS" category.
     * {@code @ColumnDefault} ensures Hibernate's schema-update ({@code ddl-auto=update}) generates this
     * NOT NULL column with a DEFAULT clause, so it can be added to a table that already has rows
     * (Postgres rejects adding a NOT NULL column with no default when the table is non-empty).
     */
    @Column(name = "is_prs", nullable = false)
    @ColumnDefault("false")
    @Builder.Default
    private boolean prs = false;
}
