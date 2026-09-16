package com.parasabha.planner.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Write model used to plan (create/update) a Swami visit for a specific calendar date.
 * P2 (Dwitiya Sant) is mandatory; P1 (Pratham Sant) is optional. Encoding convention for
 * {@link #swamiIds}: if only one Swami is planned, that entry IS P2 (P1 left blank); if two
 * or more are planned, index 0 is P1 and index 1 is P2, with any further entries being extra
 * Sant Mandal beyond P1/P2. The same Swami may be planned for multiple Mandals and/or
 * weekdays - there is no cross-visit uniqueness restriction, and P1/P2 are not required to
 * be different Sant Mandal.
 */
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

    /** Ordered list of Swami IDs planned for this visit - see class javadoc for the P1/P2 encoding convention. */
    @NotEmpty(message = "P2 is required")
    private List<Long> swamiIds;

    /** Free-text vehicle arrangement (વાહન વ્યવસ્થા) note for this visit - optional. */
    private String vehicleArrangement;
}
