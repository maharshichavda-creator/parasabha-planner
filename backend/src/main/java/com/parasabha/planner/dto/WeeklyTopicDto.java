package com.parasabha.planner.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Read model for the P1/P2 પ્રવચન વિષય (discourse topic) planned for a given week. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyTopicDto {
    private Long id;
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
