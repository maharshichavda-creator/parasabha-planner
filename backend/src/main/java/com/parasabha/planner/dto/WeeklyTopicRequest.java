package com.parasabha.planner.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Write model used to plan (create/update) the P1/P2 પ્રવચન વિષય (discourse topic) - and an
 * optional link for each - for a specific week. Both P1 and P2 topic/link are optional;
 * saving with blank values simply clears them for that week.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyTopicRequest {

    @NotNull(message = "Week start is required")
    private LocalDate weekStart;

    /** P1 (પ્રથમ સંત) પ્રવચન વિષય - optional. */
    private String p1Topic;

    /** Link (e.g. recording/reference) for the P1 પ્રવચન - optional. */
    private String p1Link;

    /** P2 (દ્વિતીય સંત) પ્રવચન વિષય - optional. */
    private String p2Topic;

    /** Link (e.g. recording/reference) for the P2 પ્રવચન - optional. */
    private String p2Link;
}
