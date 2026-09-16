package com.parasabha.planner.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single row of the weekly Parasabha schedule: a Mandal assigned to a Weekday.
 * This is the recurring template only (which Mandal meets on which weekday) - it does
 * NOT carry a default Sant Mandal (Swami) assignment. Which Swami(s) actually visit is
 * planned separately, per calendar week, via {@link SwamiVisit}.
 */
@Entity
@Table(name = "schedule_entry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "weekday", nullable = false, length = 20)
    private Weekday weekday;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mandal_id", nullable = false)
    private Mandal mandal;

    /** Ordering of this entry within its weekday, for consistent display in the weekly grid. */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
