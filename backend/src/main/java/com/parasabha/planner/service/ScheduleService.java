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
     * PRS entries (no fixed weekday) never get their own group here: they only appear once a
     * visit is planned, and are shown under whichever Mon-Sat day was chosen for that visit.
     */
    @Transactional(readOnly = true)
    public List<WeeklyScheduleDayDto> weeklyGrid(LocalDate weekStart) {
        List<ScheduleEntry> sorted = scheduleEntryRepository.findAllByOrderBySortOrderAsc().stream()
                .sorted(Comparator.comparing(ScheduleEntry::getSortOrder))
                .toList();

        LocalDate weekEnd = WeekUtil.weekEnd(weekStart);
        List<SwamiVisit> visits = swamiVisitRepository.findByVisitDateBetween(weekStart, weekEnd);

        // Key: scheduleEntryId -> that entry's visit for this week (at most one, by design).
        Map<Long, SwamiVisit> visitsByEntryId = new HashMap<>();
        for (SwamiVisit visit : visits) {
            visitsByEntryId.put(visit.getScheduleEntry().getId(), visit);
        }

        Map<Weekday, List<ScheduleEntryDto>> grouped = new LinkedHashMap<>();
        for (Weekday weekday : Weekday.values()) {
            grouped.put(weekday, new ArrayList<>());
        }

        // Regular entries keep their fixed weekday slot.
        for (ScheduleEntry entry : sorted) {
            if (entry.getWeekday() == Weekday.PRS) {
                continue;
            }
            SwamiVisit visit = visitsByEntryId.get(entry.getId());
            List<SwamiDto> swamis = visit != null ? toSwamiDtos(visit) : List.of();
            String vehicleArrangement = visit != null ? visit.getVehicleArrangement() : null;
            grouped.get(entry.getWeekday()).add(toDto(entry, swamis, vehicleArrangement));
        }

        // PRS entries only show up this week if a visit was actually planned, under whichever
        // weekday was chosen for that visit.
        for (ScheduleEntry entry : sorted) {
            if (entry.getWeekday() != Weekday.PRS) {
                continue;
            }
            SwamiVisit visit = visitsByEntryId.get(entry.getId());
            if (visit == null) {
                continue;
            }
            Weekday effectiveWeekday = WeekUtil.weekdayForDate(weekStart, visit.getVisitDate());
            if (effectiveWeekday == null) {
                continue;
            }
            grouped.get(effectiveWeekday).add(toDto(entry, toSwamiDtos(visit), visit.getVehicleArrangement()));
        }

        List<WeeklyScheduleDayDto> result = new ArrayList<>();
        for (Weekday weekday : Weekday.values()) {
            if (weekday == Weekday.PRS) {
                continue;
            }
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
        entry = scheduleEntryRepository.save(entry);

        syncMandalPrsFlag(mandal);

        return toDto(entry, List.of());
    }

    public ScheduleEntryDto update(Long id, ScheduleEntryRequest request) {
        ScheduleEntry entry = getOrThrow(id);
        Mandal previousMandal = entry.getMandal();
        Mandal mandal = mandalRepository.findById(request.getMandalId())
                .orElseThrow(() -> new ResourceNotFoundException("Mandal not found with id " + request.getMandalId()));

        entry.setWeekday(request.getWeekday());
        entry.setMandal(mandal);
        if (request.getSortOrder() != null) {
            entry.setSortOrder(request.getSortOrder());
        }

        syncMandalPrsFlag(mandal);
        if (!previousMandal.getId().equals(mandal.getId())) {
            syncMandalPrsFlag(previousMandal);
        }

        return toDto(entry, List.of());
    }

    public void delete(Long id) {
        ScheduleEntry entry = getOrThrow(id);
        Mandal mandal = entry.getMandal();
        // Remove any planned swami visits for this entry first so the delete never fails on
        // the FK constraint.
        swamiVisitRepository.deleteAll(swamiVisitRepository.findByScheduleEntry_Id(id));
        scheduleEntryRepository.deleteById(id);

        syncMandalPrsFlag(mandal);
    }

    /**
     * Keeps {@link Mandal#isPrs()} consistent with whether the mandal exists purely for the
     * PRS group - i.e. it has a PRS schedule entry but no regular (Mon-Sat) weekday of its own.
     * A mandal that already has a regular/PR weekday slot (like a name reused across both a
     * fixed weekday and the additional PRS group in the source schedule) keeps its primary
     * "regular"/"PR" categorization on the Mandals screen even though it also shows up under
     * PRS in the weekly plan - only mandals dedicated solely to the PRS group get tagged and
     * moved into the PRS bucket there.
     */
    private void syncMandalPrsFlag(Mandal mandal) {
        List<ScheduleEntry> entries = scheduleEntryRepository.findByMandal_Id(mandal.getId());
        boolean hasPrsEntry = entries.stream().anyMatch(e -> e.getWeekday() == Weekday.PRS);
        boolean hasNonPrsEntry = entries.stream().anyMatch(e -> e.getWeekday() != Weekday.PRS);
        boolean shouldBePrs = hasPrsEntry && !hasNonPrsEntry;
        if (mandal.isPrs() != shouldBePrs) {
            mandal.setPrs(shouldBePrs);
            mandalRepository.save(mandal);
        }
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

    private static List<SwamiDto> toSwamiDtos(SwamiVisit visit) {
        List<SwamiDto> swamis = new ArrayList<>();
        visit.getAssignments().forEach(a -> swamis.add(SwamiDto.builder()
                .id(a.getSwami().getId())
                .name(a.getSwami().getName())
                .build()));
        return Collections.unmodifiableList(swamis);
    }

    private ScheduleEntryDto toDto(ScheduleEntry entry, List<SwamiDto> swamis) {
        return toDto(entry, swamis, null);
    }

    private ScheduleEntryDto toDto(ScheduleEntry entry, List<SwamiDto> swamis, String vehicleArrangement) {
        return ScheduleEntryDto.builder()
                .id(entry.getId())
                .weekday(entry.getWeekday())
                .weekdayLabel(entry.getWeekday().getDisplayName())
                .sortOrder(entry.getSortOrder())
                .mandalId(entry.getMandal().getId())
                .mandalName(entry.getMandal().getName())
                .mandalPr(entry.getMandal().isPr())
                .mandalYuvak(entry.getMandal().isYuvak())
                .swamis(swamis)
                .vehicleArrangement(vehicleArrangement)
                .build();
    }
}
