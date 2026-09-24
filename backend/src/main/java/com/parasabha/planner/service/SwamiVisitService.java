package com.parasabha.planner.service;

import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.Swami;
import com.parasabha.planner.domain.SwamiVisit;
import com.parasabha.planner.domain.SwamiVisitAssignment;
import com.parasabha.planner.domain.Weekday;
import com.parasabha.planner.dto.SwamiDto;
import com.parasabha.planner.dto.SwamiVisitDto;
import com.parasabha.planner.dto.SwamiVisitRequest;
import com.parasabha.planner.exception.ResourceNotFoundException;
import com.parasabha.planner.repository.ScheduleEntryRepository;
import com.parasabha.planner.repository.SwamiRepository;
import com.parasabha.planner.repository.SwamiVisitRepository;
import com.parasabha.planner.util.WeekUtil;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages Swami visits: which Swami(s), if any, are planned to lead a given
 * ScheduleEntry's Parasabha on a specific calendar date. A slot with no SwamiVisit
 * for a given week is simply blank for that week - nothing carries over automatically.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SwamiVisitService {

    private final SwamiVisitRepository swamiVisitRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;
    private final SwamiRepository swamiRepository;

    @Transactional(readOnly = true)
    public List<SwamiVisitDto> listForWeek(LocalDate weekStart) {
        LocalDate weekEnd = WeekUtil.weekEnd(weekStart);
        return swamiVisitRepository.findByVisitDateBetween(weekStart, weekEnd).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Creates a new visit, or updates the existing one if this entry already has a plan for
     * that date. For PRS entries (whose display day is chosen per-visit rather than fixed), the
     * lookup instead matches any existing visit for this entry within the same week as the
     * requested date, so changing the chosen day moves the existing plan instead of duplicating it.
     */
    public SwamiVisitDto upsert(SwamiVisitRequest request) {
        ScheduleEntry scheduleEntry = scheduleEntryRepository.findById(request.getScheduleEntryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule entry not found with id " + request.getScheduleEntryId()));

        SwamiVisit visit = findExistingVisit(scheduleEntry, request.getVisitDate())
                .orElseGet(() -> SwamiVisit.builder()
                        .scheduleEntry(scheduleEntry)
                        .build());
        visit.setVisitDate(request.getVisitDate());

        visit.getAssignments().clear();
        applySwamis(visit, request.getSwamiIds());
        visit.setVehicleArrangement(normalizeVehicleArrangement(request.getVehicleArrangement()));

        return toDto(swamiVisitRepository.save(visit));
    }

    public SwamiVisitDto update(Long id, SwamiVisitRequest request) {
        SwamiVisit visit = getOrThrow(id);
        if (request.getVisitDate() != null) {
            visit.setVisitDate(request.getVisitDate());
        }
        visit.getAssignments().clear();
        applySwamis(visit, request.getSwamiIds());
        visit.setVehicleArrangement(normalizeVehicleArrangement(request.getVehicleArrangement()));
        return toDto(visit);
    }

    public void delete(Long id) {
        if (!swamiVisitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Swami visit not found with id " + id);
        }
        swamiVisitRepository.deleteById(id);
    }

    private void applySwamis(SwamiVisit visit, List<Long> swamiIds) {
        if (swamiIds == null) {
            return;
        }
        int sequence = 0;
        for (Long swamiId : swamiIds) {
            Swami swami = swamiRepository.findById(swamiId)
                    .orElseThrow(() -> new ResourceNotFoundException("Swami not found with id " + swamiId));
            visit.getAssignments().add(SwamiVisitAssignment.builder()
                    .swamiVisit(visit)
                    .swami(swami)
                    .sequence(sequence++)
                    .build());
        }
    }

    private String normalizeVehicleArrangement(String vehicleArrangement) {
        if (vehicleArrangement == null) {
            return null;
        }
        String trimmed = vehicleArrangement.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * For PRS entries, the chosen display day (and therefore the exact visit date) can change
     * between saves, so we look up any existing visit within that date's week rather than an
     * exact date match - otherwise changing the day would leave a stale duplicate behind.
     */
    private Optional<SwamiVisit> findExistingVisit(ScheduleEntry scheduleEntry, LocalDate visitDate) {
        if (scheduleEntry.getWeekday() == Weekday.PRS) {
            LocalDate weekStart = WeekUtil.mondayOf(visitDate);
            LocalDate weekEnd = WeekUtil.weekEnd(weekStart);
            return swamiVisitRepository.findFirstByScheduleEntry_IdAndVisitDateBetween(
                    scheduleEntry.getId(), weekStart, weekEnd);
        }
        return swamiVisitRepository.findByScheduleEntry_IdAndVisitDate(scheduleEntry.getId(), visitDate);
    }

    private SwamiVisit getOrThrow(Long id) {
        return swamiVisitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Swami visit not found with id " + id));
    }

    private SwamiVisitDto toDto(SwamiVisit visit) {
        ScheduleEntry entry = visit.getScheduleEntry();
        List<SwamiDto> swamis = new ArrayList<>();
        visit.getAssignments().forEach(a -> swamis.add(
                SwamiDto.builder().id(a.getSwami().getId()).name(a.getSwami().getName()).build()));

        return SwamiVisitDto.builder()
                .id(visit.getId())
                .visitDate(visit.getVisitDate())
                .scheduleEntryId(entry.getId())
                .weekday(entry.getWeekday())
                .weekdayLabel(entry.getWeekday().getDisplayName())
                .mandalId(entry.getMandal().getId())
                .mandalName(entry.getMandal().getName())
                .mandalPr(entry.getMandal().isPr())
                .mandalYuvak(entry.getMandal().isYuvak())
                .swamis(swamis)
                .vehicleArrangement(visit.getVehicleArrangement())
                .build();
    }
}
