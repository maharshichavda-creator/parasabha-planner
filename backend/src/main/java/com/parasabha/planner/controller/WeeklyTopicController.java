package com.parasabha.planner.controller;

import com.parasabha.planner.dto.WeeklyTopicDto;
import com.parasabha.planner.dto.WeeklyTopicRequest;
import com.parasabha.planner.service.WeeklyTopicService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weekly-topics")
@RequiredArgsConstructor
public class WeeklyTopicController {

    private final WeeklyTopicService weeklyTopicService;

    @GetMapping
    public WeeklyTopicDto getForWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        LocalDate resolvedWeekStart = weekStart != null ? weekStart : LocalDate.now();
        return weeklyTopicService.getForWeek(resolvedWeekStart);
    }

    @PutMapping
    public WeeklyTopicDto upsert(@Valid @RequestBody WeeklyTopicRequest request) {
        return weeklyTopicService.upsert(request);
    }
}
