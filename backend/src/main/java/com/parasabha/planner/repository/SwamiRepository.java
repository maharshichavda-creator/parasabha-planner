package com.parasabha.planner.repository;

import com.parasabha.planner.domain.Swami;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SwamiRepository extends JpaRepository<Swami, Long> {
    Optional<Swami> findByNameIgnoreCase(String name);
}
