package com.clearstock.backend.user;

import com.clearstock.backend.user.dto.ToggleNotificationsRequest;
import com.clearstock.backend.user.dto.UpdateProfileRequest;
import com.clearstock.backend.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(User user) {
        return mapToResponse(user);
    }

    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        return mapToResponse(userRepository.save(user));
    }

    public UserProfileResponse updateEmail(User user, String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must not be empty");
        }
        user.setEmail(email.strip());
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserProfileResponse toggleEmailNotifications(User user, ToggleNotificationsRequest request) {
        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        managed.setPreferEmail(request.isPreferEmail());
        return mapToResponse(userRepository.save(managed));
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .name(user.getName())
                .email(user.getEmail())
                .preferEmail(user.getPreferEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
