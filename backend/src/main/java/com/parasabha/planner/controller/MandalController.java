package com.parasabha.planner.controller;

import com.parasabha.planner.dto.MandalDto;
import com.parasabha.planner.service.MandalService;
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
@RequestMapping("/api/mandals")
@RequiredArgsConstructor
public class MandalController {

    private final MandalService mandalService;

    @GetMapping
    public List<MandalDto> findAll() {
        return mandalService.findAll();
    }

    @GetMapping("/{id}")
    public MandalDto findById(@PathVariable Long id) {
        return mandalService.findById(id);
    }

    @PostMapping
    public ResponseEntity<MandalDto> create(@Valid @RequestBody MandalDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mandalService.create(request));
    }

    @PutMapping("/{id}")
    public MandalDto update(@PathVariable Long id, @Valid @RequestBody MandalDto request) {
        return mandalService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mandalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
