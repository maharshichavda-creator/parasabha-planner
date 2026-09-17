package com.parasabha.planner.service;

import com.parasabha.planner.domain.Mandal;
import com.parasabha.planner.domain.Swami;
import com.parasabha.planner.domain.SwamiVisit;
import com.parasabha.planner.domain.Weekday;
import com.parasabha.planner.dto.MonthlyDashboardDto;
import com.parasabha.planner.dto.MonthlyMandalStatDto;
import com.parasabha.planner.dto.MonthlySwamiStatDto;
import com.parasabha.planner.repository.SwamiVisitRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates planned Swami visits into monthly dashboard statistics: how many Mandals
 * each Swami visited, and how many times each Mandal was visited, for a selected month.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final SwamiVisitRepository swamiVisitRepository;

    public MonthlyDashboardDto getMonthlyStats(YearMonth month) {
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();
        List<SwamiVisit> visits = swamiVisitRepository.findByVisitDateBetween(start, end);

        Map<Long, String> swamiNames = new LinkedHashMap<>();
        Map<Long, Integer> swamiCounts = new LinkedHashMap<>();
        Map<MandalStatKey, String> mandalNames = new LinkedHashMap<>();
        Map<MandalStatKey, Boolean> mandalPrFlags = new LinkedHashMap<>();
        Map<MandalStatKey, Integer> mandalCounts = new LinkedHashMap<>();

        for (SwamiVisit visit : visits) {
            Mandal mandal = visit.getScheduleEntry().getMandal();
            // A Mandal planned under its regular weekday and one planned under the special PRS
            // group are treated as distinct rows here, even when they share the same underlying
            // Mandal record - e.g. "બાલાજીનગર" on Wednesday vs. "બાલાજીનગર" (PRS) on Saturday.
            boolean isPrsVisit = visit.getScheduleEntry().getWeekday() == Weekday.PRS;
            MandalStatKey key = new MandalStatKey(mandal.getId(), isPrsVisit);
            mandalNames.putIfAbsent(key, mandal.getName());
            mandalPrFlags.putIfAbsent(key, mandal.isPr());
            mandalCounts.merge(key, 1, Integer::sum);

            for (var assignment : visit.getAssignments()) {
                Swami swami = assignment.getSwami();
                swamiNames.putIfAbsent(swami.getId(), swami.getName());
                swamiCounts.merge(swami.getId(), 1, Integer::sum);
            }
        }

        List<MonthlySwamiStatDto> swamiStats = swamiCounts.entrySet().stream()
                .map(e -> MonthlySwamiStatDto.builder()
                        .swamiId(e.getKey())
                        .swamiName(swamiNames.get(e.getKey()))
                        .visitCount(e.getValue())
                        .build())
                .sorted(Comparator.comparingInt(MonthlySwamiStatDto::getVisitCount).reversed()
                        .thenComparing(dto -> dto.getSwamiName().toLowerCase(Locale.ROOT)))
                .toList();

        List<MonthlyMandalStatDto> mandalStats = mandalCounts.entrySet().stream()
                .map(e -> MonthlyMandalStatDto.builder()
                        .mandalId(e.getKey().mandalId())
                        .mandalName(mandalNames.get(e.getKey()))
                        .mandalPr(mandalPrFlags.get(e.getKey()))
                        .prs(e.getKey().prs())
                        .visitCount(e.getValue())
                        .build())
                .sorted(Comparator.comparingInt(MonthlyMandalStatDto::getVisitCount).reversed()
                        .thenComparing(dto -> dto.getMandalName().toLowerCase(Locale.ROOT)))
                .toList();

        return MonthlyDashboardDto.builder()
                .month(month.toString())
                .monthLabel(month.format(MONTH_LABEL_FORMAT))
                .totalVisits(visits.size())
                .swamiStats(swamiStats)
                .mandalStats(mandalStats)
                .build();
    }

    /** Groups Mandal visit counts by Mandal + whether it was a PRS-group visit, so the same
     * Mandal planned both under a regular weekday and under PRS is reported as two rows. */
    private record MandalStatKey(Long mandalId, boolean prs) {
    }
}
