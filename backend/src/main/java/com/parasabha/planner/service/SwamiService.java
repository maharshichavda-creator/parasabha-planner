package com.parasabha.planner.service;

import com.parasabha.planner.domain.Swami;
import com.parasabha.planner.dto.SwamiDto;
import com.parasabha.planner.exception.DuplicateResourceException;
import com.parasabha.planner.exception.ResourceNotFoundException;
import com.parasabha.planner.repository.SwamiRepository;
import com.parasabha.planner.repository.SwamiVisitAssignmentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SwamiService {

    private final SwamiRepository swamiRepository;
    private final SwamiVisitAssignmentRepository swamiVisitAssignmentRepository;

    @Transactional(readOnly = true)
    public List<SwamiDto> findAll() {
        return swamiRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SwamiDto findById(Long id) {
        return toDto(getOrThrow(id));
    }

    public SwamiDto create(SwamiDto request) {
        swamiRepository.findByNameIgnoreCase(request.getName().trim()).ifPresent(s -> {
            throw new DuplicateResourceException("A swami named '" + request.getName() + "' already exists");
        });
        Swami swami = Swami.builder().name(request.getName().trim()).build();
        return toDto(swamiRepository.save(swami));
    }

    public SwamiDto update(Long id, SwamiDto request) {
        Swami swami = getOrThrow(id);
        swamiRepository.findByNameIgnoreCase(request.getName().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("A swami named '" + request.getName() + "' already exists");
            }
        });
        swami.setName(request.getName().trim());
        return toDto(swami);
    }

    public void delete(Long id) {
        if (!swamiRepository.existsById(id)) {
            throw new ResourceNotFoundException("Swami not found with id " + id);
        }
        // Remove this swami's assignments from any planned visits first so the delete never
        // fails on the FK constraint (the visits/schedule entries themselves are kept).
        swamiVisitAssignmentRepository.deleteAll(swamiVisitAssignmentRepository.findBySwami_Id(id));
        swamiRepository.deleteById(id);
    }

    private Swami getOrThrow(Long id) {
        return swamiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Swami not found with id " + id));
    }

    private SwamiDto toDto(Swami swami) {
        return SwamiDto.builder().id(swami.getId()).name(swami.getName()).build();
    }
}
