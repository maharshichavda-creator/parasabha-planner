package com.parasabha.planner.repository;

import com.parasabha.planner.domain.Mandal;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandalRepository extends JpaRepository<Mandal, Long> {
    Optional<Mandal> findByNameIgnoreCase(String name);

    Optional<Mandal> findByNameIgnoreCaseAndPrs(String name, boolean prs);

    Optional<Mandal> findByNameIgnoreCaseAndPrsAndYuvak(String name, boolean prs, boolean yuvak);
}
