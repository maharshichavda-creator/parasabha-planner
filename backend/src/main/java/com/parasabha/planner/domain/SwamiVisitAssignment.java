package com.parasabha.planner.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Join entity linking a SwamiVisit to an assigned Swami, preserving the order in which
 * multiple Swamis are listed for that specific visit (e.g. primary/secondary Sant Mandal).
 */
@Entity
@Table(name = "swami_visit_assignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwamiVisitAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "swami_visit_id", nullable = false)
    private SwamiVisit swamiVisit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "swami_id", nullable = false)
    private Swami swami;

    @Column(nullable = false)
    @Builder.Default
    private Integer sequence = 0;
}
