package com.parasabha.planner.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Aggregated Swami-visit statistics for a single calendar year, mirroring
 * {@link MonthlyDashboardDto} but covering January through December.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YearlyDashboardDto {
    private int year;

    /** Total number of planned Swami visits in the year (across all Mandals/Swamis). */
    private int totalVisits;

    /** Per-Swami visit counts, ranked highest first. */
    private List<MonthlySwamiStatDto> swamiStats;

    /** Per-Mandal visit counts, ranked highest first. */
    private List<MonthlyMandalStatDto> mandalStats;
}
