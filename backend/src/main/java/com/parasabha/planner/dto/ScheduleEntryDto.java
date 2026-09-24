package com.parasabha.planner.dto;

import com.parasabha.planner.domain.Weekday;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Read model for a schedule entry, returned by the API. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEntryDto {
    private Long id;
    private Weekday weekday;
    private String weekdayLabel;
    private Integer sortOrder;

    private Long mandalId;
    private String mandalName;
    private boolean mandalPr;
    private boolean mandalYuvak;

    private List<SwamiDto> swamis;

    /** Free-text vehicle arrangement (વાહન વ્યવસ્થા) note planned for this entry's exact date this week. */
    private String vehicleArrangement;
}
