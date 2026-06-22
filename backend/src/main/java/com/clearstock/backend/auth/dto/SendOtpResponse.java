package com.clearstock.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SendOtpResponse {

    /** Returned in response for simulation — remove in production. */
    private String otp;
    private LocalDateTime expiresAt;
}
