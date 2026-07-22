package com.clearstock.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SendOtpResponse {

    /** Null when OTP was sent to email instead. */
    private String otp;
    private LocalDateTime expiresAt;
    private boolean emailSent;
}
