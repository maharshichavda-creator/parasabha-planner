package com.parasabha.planner.repository;

import com.parasabha.planner.domain.SwamiVisitAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SwamiVisitAssignmentRepository extends JpaRepository<SwamiVisitAssignment, Long> {
    List<SwamiVisitAssignment> findBySwami_Id(Long swamiId);
}
