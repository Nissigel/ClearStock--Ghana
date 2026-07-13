package com.clearstock.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePinRequest {

    @NotBlank(message = "Current PIN is required")
    @Pattern(regexp = "\\d{4}", message = "PIN must be exactly 4 digits")
    private String currentPin;

    @NotBlank(message = "New PIN is required")
    @Pattern(regexp = "\\d{4}", message = "PIN must be exactly 4 digits")
    private String newPin;
}
