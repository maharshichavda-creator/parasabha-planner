package com.parasabha.planner.service;

import com.parasabha.planner.domain.AppUser;
import com.parasabha.planner.dto.LoginRequest;
import com.parasabha.planner.dto.LoginResponse;
import com.parasabha.planner.exception.InvalidCredentialsException;
import com.parasabha.planner.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Validates the given credentials against the {@code app_user} table. Both an unknown
     * username and a wrong password are rejected with the same generic message, so callers
     * can't use the error to enumerate valid usernames.
     */
    public LoginResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByUsernameIgnoreCase(request.getUsername().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return LoginResponse.builder().username(user.getUsername()).build();
    }
}
