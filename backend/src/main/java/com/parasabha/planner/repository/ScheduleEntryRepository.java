package com.parasabha.planner.repository;

import com.parasabha.planner.domain.ScheduleEntry;
import com.parasabha.planner.domain.Weekday;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleEntryRepository extends JpaRepository<ScheduleEntry, Long> {

    // Note: intentionally NOT ordering by weekday in the query - Weekday is persisted as a
    // STRING enum, so SQL/JPQL ordering would sort alphabetically instead of Mon->Sat->PRS.
    // Callers should group/sort by Weekday.ordinal() in Java (see ScheduleService).
    @EntityGraph(attributePaths = {"mandal"})
    List<ScheduleEntry> findAllByOrderBySortOrderAsc();

    @EntityGraph(attributePaths = {"mandal"})
    List<ScheduleEntry> findAllByWeekdayOrderBySortOrderAsc(Weekday weekday);

    List<ScheduleEntry> findByMandal_Id(Long mandalId);
}
