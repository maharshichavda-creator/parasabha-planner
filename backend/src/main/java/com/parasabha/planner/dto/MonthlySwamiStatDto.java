package com.parasabha.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** How many Mandal visits a given Swami led within a selected month. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlySwamiStatDto {
    private Long swamiId;
    private String swamiName;
    private int visitCount;
}
