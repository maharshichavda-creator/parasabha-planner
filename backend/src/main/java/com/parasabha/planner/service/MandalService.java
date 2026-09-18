package com.parasabha.planner.service;

import com.parasabha.planner.domain.Mandal;
import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.Weekday;
import com.parasabha.planner.dto.MandalDto;
import com.parasabha.planner.exception.DuplicateResourceException;
import com.parasabha.planner.exception.ResourceNotFoundException;
import com.parasabha.planner.repository.MandalRepository;
import com.parasabha.planner.repository.ScheduleEntryRepository;
import com.parasabha.planner.repository.SwamiVisitRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MandalService {

    private final MandalRepository mandalRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;
    private final SwamiVisitRepository swamiVisitRepository;

    @Transactional(readOnly = true)
    public List<MandalDto> findAll() {
        return mandalRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MandalDto findById(Long id) {
        return toDto(getOrThrow(id));
    }

    public MandalDto create(MandalDto request) {
        mandalRepository.findByNameIgnoreCaseAndPrs(request.getName().trim(), request.isPrs()).ifPresent(m -> {
            throw new DuplicateResourceException("A mandal named '" + request.getName() + "' already exists");
        });
        Mandal mandal = Mandal.builder()
                .name(request.getName().trim())
                .pr(request.isPr())
                .prs(request.isPrs())
                .build();
        mandal = mandalRepository.save(mandal);
        ensurePrsScheduleEntry(mandal);
        return toDto(mandal);
    }

    public MandalDto update(Long id, MandalDto request) {
        Mandal mandal = getOrThrow(id);
        mandalRepository.findByNameIgnoreCaseAndPrs(request.getName().trim(), request.isPrs()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("A mandal named '" + request.getName() + "' already exists");
            }
        });
        mandal.setName(request.getName().trim());
        mandal.setPr(request.isPr());
        mandal.setPrs(request.isPrs());
        ensurePrsScheduleEntry(mandal);
        return toDto(mandal);
    }

    public void delete(Long id) {
        if (!mandalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Mandal not found with id " + id);
        }
        // Remove dependent schedule entries (and their planned swami visits) first so this
        // delete never fails on the FK constraints.
        List<ScheduleEntry> entries = scheduleEntryRepository.findByMandal_Id(id);
        for (ScheduleEntry entry : entries) {
            swamiVisitRepository.deleteAll(swamiVisitRepository.findByScheduleEntry_Id(entry.getId()));
        }
        scheduleEntryRepository.deleteAll(entries);
        mandalRepository.deleteById(id);
    }

    /**
     * Whenever a mandal is marked as belonging to the PRS category, make sure it has a
     * corresponding schedule entry under the PRS weekday, so it shows up under "PRS" in the
     * weekday column on the Plan Swami Visits screen without a separate manual step.
     */
    private void ensurePrsScheduleEntry(Mandal mandal) {
        if (!mandal.isPrs()) {
            return;
        }
        boolean alreadyScheduledUnderPrs = scheduleEntryRepository.findByMandal_Id(mandal.getId()).stream()
                .anyMatch(entry -> entry.getWeekday() == Weekday.PRS);
        if (alreadyScheduledUnderPrs) {
            return;
        }
        ScheduleEntry entry = ScheduleEntry.builder()
                .weekday(Weekday.PRS)
                .mandal(mandal)
                .sortOrder(nextPrsSortOrder())
                .build();
        scheduleEntryRepository.save(entry);
    }

    private int nextPrsSortOrder() {
        return scheduleEntryRepository.findAllByWeekdayOrderBySortOrderAsc(Weekday.PRS).stream()
                .mapToInt(ScheduleEntry::getSortOrder)
                .max()
                .orElse(-1) + 1;
    }

    private Mandal getOrThrow(Long id) {
        return mandalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mandal not found with id " + id));
    }

    private MandalDto toDto(Mandal mandal) {
        return MandalDto.builder()
                .id(mandal.getId())
                .name(mandal.getName())
                .pr(mandal.isPr())
                .prs(mandal.isPrs())
                .build();
    }
}
