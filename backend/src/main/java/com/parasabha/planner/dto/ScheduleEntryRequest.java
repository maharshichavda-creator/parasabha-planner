package com.parasabha.planner.dto;

import com.parasabha.planner.domain.Weekday;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Write model used to create or update a schedule entry (the recurring Mandal + Weekday
 * template). This does NOT include Swami assignments - those are planned per calendar
 * week via {@link SwamiVisitRequest}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEntryRequest {

    @NotNull(message = "Weekday is required")
    private Weekday weekday;

    @NotNull(message = "Mandal is required")
    private Long mandalId;

    private Integer sortOrder;
}
