package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "OTP code is required")
    private String otpCode;
}
