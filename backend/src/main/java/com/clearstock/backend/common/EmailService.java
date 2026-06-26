package com.clearstock.backend.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public boolean sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your ClearStock OTP");
            message.setText(
                    "Your ClearStock verification code is: " + otp +
                    "\n\nThis code expires in 5 minutes. Do not share it with anyone." +
                    "\n\n— The ClearStock Ghana Team"
            );
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    public void sendWelcomeEmail(String to, String name) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Welcome to ClearStock Ghana");
            message.setText(
                    "Hi " + name + ",\n\n" +
                    "Welcome to ClearStock Ghana! Your account has been created successfully.\n\n" +
                    "You can now browse and purchase cleared stock from sellers across Ghana.\n\n" +
                    "— The ClearStock Ghana Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", to, e.getMessage());
        }
    }
}
