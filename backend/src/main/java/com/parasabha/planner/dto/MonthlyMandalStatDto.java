package com.parasabha.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** How many times a given Mandal was visited by a Swami within a selected month. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyMandalStatDto {
    private Long mandalId;
    private String mandalName;
    private boolean mandalPr;
    /** True if any of this Mandal's visits in the month were planned under the special PRS group. */
    private boolean prs;
    private int visitCount;
}
