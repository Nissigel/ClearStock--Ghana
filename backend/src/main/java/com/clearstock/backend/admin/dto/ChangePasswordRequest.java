package com.clearstock.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Enter your current password")
    private String currentPassword;

    @NotBlank(message = "Enter a new password")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;
}
