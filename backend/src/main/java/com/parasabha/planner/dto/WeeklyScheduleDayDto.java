package com.parasabha.planner.dto;

import com.parasabha.planner.domain.Weekday;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One day's worth of entries for the weekly grid view. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyScheduleDayDto {
    private Weekday weekday;
    private String weekdayLabel;
    private List<ScheduleEntryDto> entries;
}
