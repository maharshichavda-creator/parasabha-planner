package com.parasabha.planner.repository;

import com.parasabha.planner.domain.SwamiVisit;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SwamiVisitRepository extends JpaRepository<SwamiVisit, Long> {

    @EntityGraph(attributePaths = {"scheduleEntry", "scheduleEntry.mandal", "assignments", "assignments.swami"})
    List<SwamiVisit> findByVisitDateBetween(LocalDate start, LocalDate end);

    Optional<SwamiVisit> findByScheduleEntry_IdAndVisitDate(Long scheduleEntryId, LocalDate visitDate);

    List<SwamiVisit> findByScheduleEntry_Id(Long scheduleEntryId);
}
