package com.parasabha.planner.service;

import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.Swami;
import com.parasabha.planner.domain.SwamiVisit;
import com.parasabha.planner.domain.SwamiVisitAssignment;
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

    /** Creates a new visit, or updates the existing one if this entry already has a plan for that date. */
    public SwamiVisitDto upsert(SwamiVisitRequest request) {
        ScheduleEntry scheduleEntry = scheduleEntryRepository.findById(request.getScheduleEntryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule entry not found with id " + request.getScheduleEntryId()));

        SwamiVisit visit = swamiVisitRepository
                .findByScheduleEntry_IdAndVisitDate(request.getScheduleEntryId(), request.getVisitDate())
                .orElseGet(() -> SwamiVisit.builder()
                        .scheduleEntry(scheduleEntry)
                        .visitDate(request.getVisitDate())
                        .build());

        visit.getAssignments().clear();
        applySwamis(visit, request.getSwamiIds());

        return toDto(swamiVisitRepository.save(visit));
    }

    public SwamiVisitDto update(Long id, SwamiVisitRequest request) {
        SwamiVisit visit = getOrThrow(id);
        if (request.getVisitDate() != null) {
            visit.setVisitDate(request.getVisitDate());
        }
        visit.getAssignments().clear();
        applySwamis(visit, request.getSwamiIds());
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
                .swamis(swamis)
                .build();
    }
}
