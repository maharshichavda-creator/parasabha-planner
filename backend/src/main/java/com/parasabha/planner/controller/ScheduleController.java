package com.parasabha.planner.controller;

import com.parasabha.planner.dto.ScheduleEntryDto;
import com.parasabha.planner.dto.ScheduleEntryRequest;
import com.parasabha.planner.dto.WeeklyScheduleDayDto;
import com.parasabha.planner.service.ScheduleService;
import com.parasabha.planner.util.WeekUtil;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public List<ScheduleEntryDto> findAll() {
        return scheduleService.findAll();
    }

    @GetMapping("/weekly")
    public List<WeeklyScheduleDayDto> weeklyGrid(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        LocalDate resolvedWeekStart = weekStart != null ? WeekUtil.mondayOf(weekStart) : WeekUtil.mondayOf(LocalDate.now());
        return scheduleService.weeklyGrid(resolvedWeekStart);
    }

    @GetMapping("/{id}")
    public ScheduleEntryDto findById(@PathVariable Long id) {
        return scheduleService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ScheduleEntryDto> create(@Valid @RequestBody ScheduleEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.create(request));
    }

    @PutMapping("/{id}")
    public ScheduleEntryDto update(@PathVariable Long id, @Valid @RequestBody ScheduleEntryRequest request) {
        return scheduleService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
