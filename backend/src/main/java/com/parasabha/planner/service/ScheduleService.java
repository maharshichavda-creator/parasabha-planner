package com.parasabha.planner.service;

import com.parasabha.planner.domain.Mandal;
import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.SwamiVisit;
import com.parasabha.planner.domain.Weekday;
import com.parasabha.planner.dto.ScheduleEntryDto;
import com.parasabha.planner.dto.ScheduleEntryRequest;
import com.parasabha.planner.dto.SwamiDto;
import com.parasabha.planner.dto.WeeklyScheduleDayDto;
import com.parasabha.planner.exception.ResourceNotFoundException;
import com.parasabha.planner.repository.MandalRepository;
import com.parasabha.planner.repository.ScheduleEntryRepository;
import com.parasabha.planner.repository.SwamiVisitRepository;
import com.parasabha.planner.util.WeekUtil;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

    private final ScheduleEntryRepository scheduleEntryRepository;
    private final MandalRepository mandalRepository;
    private final SwamiVisitRepository swamiVisitRepository;

    @Transactional(readOnly = true)
    public List<ScheduleEntryDto> findAll() {
        return scheduleEntryRepository.findAllByOrderBySortOrderAsc().stream()
                .sorted(Comparator.comparing((ScheduleEntry e) -> e.getWeekday().ordinal())
                        .thenComparing(ScheduleEntry::getSortOrder))
                .map(entry -> toDto(entry, List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleEntryDto findById(Long id) {
        return toDto(getOrThrow(id), List.of());
    }

    /**
     * Weekly grid for the week starting at {@code weekStart} (a Monday). Swamis shown for
     * each entry are ONLY those explicitly planned (via SwamiVisit) for that entry's exact
     * date within this week - entries with no plan for this week show no Swamis at all.
     */
    @Transactional(readOnly = true)
    public List<WeeklyScheduleDayDto> weeklyGrid(LocalDate weekStart) {
        List<ScheduleEntry> all = scheduleEntryRepository.findAllByOrderBySortOrderAsc();

        LocalDate weekEnd = WeekUtil.weekEnd(weekStart);
        List<SwamiVisit> visits = swamiVisitRepository.findByVisitDateBetween(weekStart, weekEnd);

        // Key: scheduleEntryId + exact date -> ordered list of swami DTOs for that visit.
        Map<String, List<SwamiDto>> visitsByEntryAndDate = new HashMap<>();
        for (SwamiVisit visit : visits) {
            String key = visitKey(visit.getScheduleEntry().getId(), visit.getVisitDate());
            visitsByEntryAndDate.put(key, toSwamiDtos(visit));
        }

        Map<Weekday, List<ScheduleEntryDto>> grouped = new LinkedHashMap<>();
        for (Weekday weekday : Weekday.values()) {
            grouped.put(weekday, new ArrayList<>());
        }
        all.stream()
                .sorted(Comparator.comparing(ScheduleEntry::getSortOrder))
                .forEach(entry -> {
                    LocalDate expectedDate = WeekUtil.expectedDate(weekStart, entry.getWeekday());
                    List<SwamiDto> swamis = visitsByEntryAndDate.getOrDefault(
                            visitKey(entry.getId(), expectedDate), List.of());
                    grouped.get(entry.getWeekday()).add(toDto(entry, swamis));
                });

        List<WeeklyScheduleDayDto> result = new ArrayList<>();
        for (Weekday weekday : Weekday.values()) {
            result.add(WeeklyScheduleDayDto.builder()
                    .weekday(weekday)
                    .weekdayLabel(weekday.getDisplayName())
                    .entries(grouped.get(weekday))
                    .build());
        }
        return result;
    }

    public ScheduleEntryDto create(ScheduleEntryRequest request) {
        Mandal mandal = mandalRepository.findById(request.getMandalId())
                .orElseThrow(() -> new ResourceNotFoundException("Mandal not found with id " + request.getMandalId()));

        ScheduleEntry entry = ScheduleEntry.builder()
                .weekday(request.getWeekday())
                .mandal(mandal)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : nextSortOrder(request.getWeekday()))
                .build();

        return toDto(scheduleEntryRepository.save(entry), List.of());
    }

    public ScheduleEntryDto update(Long id, ScheduleEntryRequest request) {
        ScheduleEntry entry = getOrThrow(id);
        Mandal mandal = mandalRepository.findById(request.getMandalId())
                .orElseThrow(() -> new ResourceNotFoundException("Mandal not found with id " + request.getMandalId()));

        entry.setWeekday(request.getWeekday());
        entry.setMandal(mandal);
        if (request.getSortOrder() != null) {
            entry.setSortOrder(request.getSortOrder());
        }

        return toDto(entry, List.of());
    }

    public void delete(Long id) {
        if (!scheduleEntryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Schedule entry not found with id " + id);
        }
        // Remove any planned swami visits for this entry first so the delete never fails on
        // the FK constraint.
        swamiVisitRepository.deleteAll(swamiVisitRepository.findByScheduleEntry_Id(id));
        scheduleEntryRepository.deleteById(id);
    }

    private int nextSortOrder(Weekday weekday) {
        return scheduleEntryRepository.findAllByWeekdayOrderBySortOrderAsc(weekday).stream()
                .mapToInt(ScheduleEntry::getSortOrder)
                .max()
                .orElse(-1) + 1;
    }

    private ScheduleEntry getOrThrow(Long id) {
        return scheduleEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule entry not found with id " + id));
    }

    private static String visitKey(Long scheduleEntryId, LocalDate date) {
        return scheduleEntryId + "|" + date;
    }

    private static List<SwamiDto> toSwamiDtos(SwamiVisit visit) {
        List<SwamiDto> swamis = new ArrayList<>();
        visit.getAssignments().forEach(a -> swamis.add(SwamiDto.builder()
                .id(a.getSwami().getId())
                .name(a.getSwami().getName())
                .build()));
        return Collections.unmodifiableList(swamis);
    }

    private ScheduleEntryDto toDto(ScheduleEntry entry, List<SwamiDto> swamis) {
        return ScheduleEntryDto.builder()
                .id(entry.getId())
                .weekday(entry.getWeekday())
                .weekdayLabel(entry.getWeekday().getDisplayName())
                .sortOrder(entry.getSortOrder())
                .mandalId(entry.getMandal().getId())
                .mandalName(entry.getMandal().getName())
                .mandalPr(entry.getMandal().isPr())
                .swamis(swamis)
                .build();
    }
}
