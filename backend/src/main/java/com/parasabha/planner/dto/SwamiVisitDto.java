package com.parasabha.planner.dto;

import com.parasabha.planner.domain.Weekday;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Read model for a planned Swami visit on a specific calendar date. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwamiVisitDto {
    private Long id;
    private LocalDate visitDate;

    private Long scheduleEntryId;
    private Weekday weekday;
    private String weekdayLabel;
    private Long mandalId;
    private String mandalName;
    private boolean mandalPr;

    private List<SwamiDto> swamis;
}
