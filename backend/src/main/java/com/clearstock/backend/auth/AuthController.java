package com.clearstock.backend.auth;

import com.clearstock.backend.auth.dto.*;
import com.clearstock.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<SendOtpResponse>> sendOtp(
            @RequestBody @Valid SendOtpRequest request) {
        SendOtpResponse data = authService.sendOtp(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", data));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verifyOtp(
            @RequestBody @Valid VerifyOtpRequest request) {
        VerifyOtpResponse data = authService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("OTP verified", data));
    }

    @PostMapping("/create-pin")
    public ResponseEntity<ApiResponse<AuthResponse>> createPin(
            @RequestBody @Valid CreatePinRequest request) {
        AuthResponse data = authService.createPin(request.getTempToken(), request.getPin());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Account created", data));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody @Valid LoginRequest request) {
        AuthResponse data = authService.login(request.getPhone(), request.getPin());
        return ResponseEntity.ok(ApiResponse.success("Login successful", data));
    }

    @PostMapping("/forgot-pin")
    public ResponseEntity<ApiResponse<SendOtpResponse>> forgotPin(
            @RequestBody @Valid ForgotPinRequest request) {
        SendOtpResponse data = authService.forgotPin(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("OTP sent for PIN reset", data));
    }

    @PostMapping("/reset-pin")
    public ResponseEntity<ApiResponse<AuthResponse>> resetPin(
            @RequestBody @Valid ResetPinRequest request) {
        AuthResponse data = authService.resetPin(request.getPhone(), request.getOtp(), request.getNewPin());
        return ResponseEntity.ok(ApiResponse.success("PIN reset successful", data));
    }
}
