package com.parasabha.planner.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Aggregated Swami-visit statistics for a single calendar month, used to drive the
 * dashboard: which Swami(s) visited how many Mandals, and which Mandal(s) were visited
 * how many times, both ranked by visit count (descending).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyDashboardDto {
    /** ISO year-month, e.g. "2026-09". */
    private String month;

    /** Human-friendly label, e.g. "September 2026". */
    private String monthLabel;

    /** Total number of planned Swami visits in the month (across all Mandals/Swamis). */
    private int totalVisits;

    /** Per-Swami visit counts, ranked highest first. */
    private List<MonthlySwamiStatDto> swamiStats;

    /** Per-Mandal visit counts, ranked highest first. */
    private List<MonthlyMandalStatDto> mandalStats;
}
