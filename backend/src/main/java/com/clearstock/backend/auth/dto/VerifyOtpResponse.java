package com.clearstock.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyOtpResponse {

    private boolean verified;
    /** False if phone is new — caller must proceed to /auth/create-pin. */
    private boolean userExists;
    /** Short-lived token valid only for /auth/create-pin. Null when userExists is true. */
    private String tempToken;
}
