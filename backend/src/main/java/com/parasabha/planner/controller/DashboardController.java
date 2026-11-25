package com.parasabha.planner.controller;

import com.parasabha.planner.dto.MonthlyDashboardDto;
import com.parasabha.planner.dto.YearlyDashboardDto;
import com.parasabha.planner.service.DashboardService;
import java.time.Year;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** @param month ISO year-month, e.g. "2026-09" (defaults to the current month). */
    @GetMapping("/monthly")
    public MonthlyDashboardDto monthly(@RequestParam(required = false) String month) {
        YearMonth resolvedMonth = (month != null && !month.isBlank()) ? YearMonth.parse(month) : YearMonth.now();
        return dashboardService.getMonthlyStats(resolvedMonth);
    }

    /** @param year calendar year, e.g. 2026 (defaults to the current year). */
    @GetMapping("/yearly")
    public YearlyDashboardDto yearly(@RequestParam(required = false) Integer year) {
        Year resolvedYear = (year != null) ? Year.of(year) : Year.now();
        return dashboardService.getYearlyStats(resolvedYear);
    }
}
