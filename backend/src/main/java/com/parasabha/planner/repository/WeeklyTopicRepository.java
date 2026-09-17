package com.parasabha.planner.repository;

import com.parasabha.planner.domain.WeeklyTopic;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeeklyTopicRepository extends JpaRepository<WeeklyTopic, Long> {

    Optional<WeeklyTopic> findByWeekStart(LocalDate weekStart);
}
