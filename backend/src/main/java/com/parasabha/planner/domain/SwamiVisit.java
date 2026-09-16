package com.parasabha.planner.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A planned Swami visit for a specific calendar date, for a given ScheduleEntry
 * (Mandal + Weekday slot). Unlike ScheduleEntry itself, this is NOT recurring:
 * a slot with no SwamiVisit for a given week is simply blank for that week.
 */
@Entity
@Table(name = "swami_visit", uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_entry_id", "visit_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwamiVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_entry_id", nullable = false)
    private ScheduleEntry scheduleEntry;

    @OneToMany(mappedBy = "swamiVisit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<SwamiVisitAssignment> assignments = new ArrayList<>();
}
