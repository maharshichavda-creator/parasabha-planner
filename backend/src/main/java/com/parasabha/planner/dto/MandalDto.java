package com.parasabha.planner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MandalDto {
    private Long id;

    @NotBlank(message = "Mandal name is required")
    private String name;

    private boolean pr;
}
