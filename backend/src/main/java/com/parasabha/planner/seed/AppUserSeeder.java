package com.parasabha.planner.seed;

import com.parasabha.planner.domain.AppUser;
import com.parasabha.planner.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a single default login account on first startup only (only if the app_user table is
 * empty) - it never overwrites existing accounts. The username/password can be changed directly
 * in the {@code app_user} table (store a new BCrypt hash for the password), or the default seeded
 * credentials can be overridden via the APP_ADMIN_USERNAME / APP_ADMIN_PASSWORD env vars before
 * the very first startup.
 */
@Component
@RequiredArgsConstructor
public class AppUserSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${APP_ADMIN_USERNAME:admin}")
    private String defaultUsername;

    @Value("${APP_ADMIN_PASSWORD:admin@123}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        if (appUserRepository.count() > 0) {
            return;
        }

        appUserRepository.save(AppUser.builder()
                .username(defaultUsername)
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .build());
    }
}
