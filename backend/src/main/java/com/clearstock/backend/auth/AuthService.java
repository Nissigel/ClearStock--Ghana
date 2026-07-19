package com.clearstock.backend.auth;

import com.clearstock.backend.auth.dto.*;
import com.clearstock.backend.common.EmailService;
import com.clearstock.backend.common.JwtUtil;
import com.clearstock.backend.common.PhoneUtil;
import com.clearstock.backend.common.SmsService;
import com.clearstock.backend.otp.OtpPurpose;
import com.clearstock.backend.otp.OtpService;
import com.clearstock.backend.user.AccountStatus;
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

    public SendOtpResponse sendOtp(String rawPhone, String email) {
        String phone = PhoneUtil.normalize(rawPhone);
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

        // The code stays on screen unless SMS was accepted.
        //
        // Email is deliberately not treated as delivery: the mail server only
        // reports that it accepted the message, not that anyone received it,
        // and a code sitting in a spam folder locks the person out of sign-up
        // with no way forward. SMS is immediate and confirmable, so it is the
        // only channel trusted to replace the on-screen fallback.
        return new SendOtpResponse(
                sms ? null : otp, LocalDateTime.now().plusMinutes(5), emailed);
    }

    public VerifyOtpResponse verifyOtp(String rawPhone, String otp) {
        String phone = PhoneUtil.normalize(rawPhone);
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

        // The subject was normalized before the token was issued; normalizing
        // again covers tokens minted before that was true.
        String phone = PhoneUtil.normalize(claims.getSubject());

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

    public AuthResponse login(String rawPhone, String pin) {
        User user = userRepository.findByPhone(PhoneUtil.normalize(rawPhone))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid PIN");
        }

        // Checked after the PIN, so a wrong PIN cannot be used to discover
        // whether an account is suspended. Without this, suspending someone
        // from the dashboard would change a label and nothing else.
        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account has been suspended. Please contact ClearStock support.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getPhone());
        return new AuthResponse(token, user.getId(), user.getPhone(), user.getName());
    }

    public SendOtpResponse forgotPin(String rawPhone) {
        String phone = PhoneUtil.normalize(rawPhone);
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        String otp = otpService.generateAndSaveOtp(phone, OtpPurpose.PIN_RESET);

        boolean sms = smsService.sendOtpSms(phone, otp);
        boolean emailed = Boolean.TRUE.equals(user.getPreferEmail())
                && StringUtils.hasText(user.getEmail())
                && emailService.sendOtpEmail(user.getEmail(), otp);

        // Same reasoning as sign-up: only SMS is treated as real delivery, so
        // someone resetting their PIN is never left waiting on an email that
        // may be sitting in spam.
        return new SendOtpResponse(
                sms ? null : otp, LocalDateTime.now().plusMinutes(5), emailed);
    }

    public AuthResponse resetPin(String rawPhone, String otp, String newPin) {
        String phone = PhoneUtil.normalize(rawPhone);
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
