package com.clearstock.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePhoneRequest {

    @NotBlank(message = "New phone number is required")
    private String newPhone;

    @NotBlank(message = "Verification code is required")
    private String otp;
}
