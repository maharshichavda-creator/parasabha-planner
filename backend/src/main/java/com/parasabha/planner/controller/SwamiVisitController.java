package com.parasabha.planner.controller;

import com.parasabha.planner.dto.SwamiVisitDto;
import com.parasabha.planner.dto.SwamiVisitRequest;
import com.parasabha.planner.service.SwamiVisitService;
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
@RequestMapping("/api/swami-visits")
@RequiredArgsConstructor
public class SwamiVisitController {

    private final SwamiVisitService swamiVisitService;

    @GetMapping
    public List<SwamiVisitDto> listForWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        LocalDate resolvedWeekStart = weekStart != null ? WeekUtil.mondayOf(weekStart) : WeekUtil.mondayOf(LocalDate.now());
        return swamiVisitService.listForWeek(resolvedWeekStart);
    }

    @PostMapping
    public ResponseEntity<SwamiVisitDto> upsert(@Valid @RequestBody SwamiVisitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(swamiVisitService.upsert(request));
    }

    @PutMapping("/{id}")
    public SwamiVisitDto update(@PathVariable Long id, @Valid @RequestBody SwamiVisitRequest request) {
        return swamiVisitService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        swamiVisitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
