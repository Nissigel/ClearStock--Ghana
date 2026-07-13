package com.clearstock.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    // Optional at sign-up: when present the code is emailed here as well.
    @Email(message = "Invalid email format")
    private String email;
}
