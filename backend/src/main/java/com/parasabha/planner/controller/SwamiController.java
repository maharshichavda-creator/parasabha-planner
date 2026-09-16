package com.parasabha.planner.controller;

import com.parasabha.planner.dto.SwamiDto;
import com.parasabha.planner.service.SwamiService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/swamis")
@RequiredArgsConstructor
public class SwamiController {

    private final SwamiService swamiService;

    @GetMapping
    public List<SwamiDto> findAll() {
        return swamiService.findAll();
    }

    @GetMapping("/{id}")
    public SwamiDto findById(@PathVariable Long id) {
        return swamiService.findById(id);
    }

    @PostMapping
    public ResponseEntity<SwamiDto> create(@Valid @RequestBody SwamiDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(swamiService.create(request));
    }

    @PutMapping("/{id}")
    public SwamiDto update(@PathVariable Long id, @Valid @RequestBody SwamiDto request) {
        return swamiService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        swamiService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
