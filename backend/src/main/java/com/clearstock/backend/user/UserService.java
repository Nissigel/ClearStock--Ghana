package com.clearstock.backend.user;

import com.clearstock.backend.otp.OtpPurpose;
import com.clearstock.backend.otp.OtpService;
import com.clearstock.backend.user.dto.ToggleNotificationsRequest;
import com.clearstock.backend.user.dto.UpdateProfileRequest;
import com.clearstock.backend.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

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

    @Transactional
    public void changePin(User user, String currentPin, String newPin) {
        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(currentPin, managed.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current PIN is incorrect");
        }

        managed.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(managed);
    }

    @Transactional
    public UserProfileResponse changePhone(User user, String newPhone, String otp) {
        String phone = newPhone == null ? "" : newPhone.strip();
        if (phone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New phone number is required");
        }

        User managed = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (phone.equals(managed.getPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That is already your phone number");
        }

        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "That phone number is already in use");
        }

        // The OTP was generated against the new number (SIGNUP purpose) by the
        // existing send-otp endpoint, so verify it here before switching over.
        boolean valid = otpService.verifyOtp(phone, otp, OtpPurpose.SIGNUP);
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
        }

        managed.setPhone(phone);
        managed.setPhoneAlt(phone);
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
