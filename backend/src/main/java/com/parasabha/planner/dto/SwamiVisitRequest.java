package com.parasabha.planner.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Write model used to plan (create/update) a Swami visit for a specific calendar date. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwamiVisitRequest {

    @NotNull(message = "Schedule entry is required")
    private Long scheduleEntryId;

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    /** Ordered list of Swami IDs planned for this visit (may be empty to just reserve the slot). */
    private List<Long> swamiIds;
}
