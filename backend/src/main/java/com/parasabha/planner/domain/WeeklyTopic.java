package com.parasabha.planner.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The P1/P2 પ્રવચન વિષય (discourse topic) planned for a given week, along with an optional
 * link (e.g. a recording or reference) for each. This is a single record per week (keyed by
 * the Monday of that week) rather than being tied to any one Mandal or ScheduleEntry.
 */
@Entity
@Table(name = "weekly_topic", uniqueConstraints = @UniqueConstraint(columnNames = "week_start"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start", nullable = false, unique = true)
    private LocalDate weekStart;

    /** P1 (પ્રથમ સંત) પ્રવચન વિષય - optional. */
    @Column(name = "p1_topic")
    private String p1Topic;

    /** Link (e.g. recording/reference) for the P1 પ્રવચન - optional. */
    @Column(name = "p1_link")
    private String p1Link;

    /** P2 (દ્વિતીય સંત) પ્રવચન વિષય - optional. */
    @Column(name = "p2_topic")
    private String p2Topic;

    /** Link (e.g. recording/reference) for the P2 પ્રવચન - optional. */
    @Column(name = "p2_link")
    private String p2Link;
}
