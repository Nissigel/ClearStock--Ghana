package com.clearstock.backend.auth;

import com.clearstock.backend.auth.dto.*;
import com.clearstock.backend.common.EmailService;
import com.clearstock.backend.common.JwtUtil;
import com.clearstock.backend.common.SmsService;
import com.clearstock.backend.otp.OtpPurpose;
import com.clearstock.backend.otp.OtpService;
import com.clearstock.backend.user.User;
import com.clearstock.backend.user.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SmsService smsService;

    public SendOtpResponse sendOtp(String phone, String email) {
        String otp = otpService.generateAndSaveOtp(phone, OtpPurpose.SIGNUP);

        // Try real delivery: SMS to the phone, plus email if one is known.
        boolean sms = smsService.sendOtpSms(phone, otp);

        String targetEmail = StringUtils.hasText(email)
                ? email
                : userRepository.findByPhone(phone)
                        .filter(u -> Boolean.TRUE.equals(u.getPreferEmail()) && StringUtils.hasText(u.getEmail()))
                        .map(User::getEmail)
                        .orElse(null);
        boolean emailed = StringUtils.hasText(targetEmail) && emailService.sendOtpEmail(targetEmail, otp);

        // Only fall back to returning the code on-screen when neither channel
        // actually delivered it.
        boolean delivered = sms || emailed;
        return new SendOtpResponse(
                delivered ? null : otp, LocalDateTime.now().plusMinutes(5), emailed);
    }

    public VerifyOtpResponse verifyOtp(String phone, String otp) {
        boolean valid = otpService.verifyOtp(phone, otp, OtpPurpose.SIGNUP);
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }

        boolean userExists = userRepository.existsByPhone(phone);
        if (userExists) {
            // Existing account — direct them to login with PIN
            return new VerifyOtpResponse(true, true, null);
        }

        String tempToken = jwtUtil.generateTempToken(phone);
        return new VerifyOtpResponse(true, false, tempToken);
    }

    public AuthResponse createPin(String tempToken, String pin, String email) {
        Claims claims;
        try {
            claims = jwtUtil.parseToken(tempToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        String purpose = claims.get("purpose", String.class);
        if (!"PIN_CREATION".equals(purpose)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token purpose");
        }

        String phone = claims.getSubject();

        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Account already exists. Please login with your PIN");
        }

        User.UserBuilder builder = User.builder()
                .phone(phone)
                .phoneAlt(phone)
                .pinHash(passwordEncoder.encode(pin))
                .name(phone)
                .region("Ghana")
                .cityTown("Unknown");

        // Save the email collected at sign-up and route future OTPs to it.
        if (StringUtils.hasText(email)) {
            builder.email(email.strip()).preferEmail(true);
        }

        User user = builder.build();

        user = userRepository.save(user);
        if (StringUtils.hasText(user.getEmail())) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        }
        String token = jwtUtil.generateToken(user.getId(), user.getPhone());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getName());
    }

    public AuthResponse login(String phone, String pin) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid PIN");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getPhone());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getName());
    }

    public SendOtpResponse forgotPin(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        String otp = otpService.generateAndSaveOtp(phone, OtpPurpose.PIN_RESET);

        boolean sms = smsService.sendOtpSms(phone, otp);
        boolean emailed = Boolean.TRUE.equals(user.getPreferEmail())
                && StringUtils.hasText(user.getEmail())
                && emailService.sendOtpEmail(user.getEmail(), otp);

        boolean delivered = sms || emailed;
        return new SendOtpResponse(
                delivered ? null : otp, LocalDateTime.now().plusMinutes(5), emailed);
    }

    public AuthResponse resetPin(String phone, String otp, String newPin) {
        boolean valid = otpService.verifyOtp(phone, otp, OtpPurpose.PIN_RESET);
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        user.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getPhone());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getName());
    }
}
