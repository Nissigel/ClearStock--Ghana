package com.clearstock.backend.user;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.user.dto.UpdateProfileRequest;
import com.clearstock.backend.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            Authentication authentication,
            @RequestBody @Valid UpdateProfileRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(user, request)));
    }
}
