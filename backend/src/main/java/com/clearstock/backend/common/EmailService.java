package com.clearstock.backend.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Attempts a send and reports exactly why it failed.
     *
     * Delivery has been failing silently and the reason only appears in the
     * host's logs, so this surfaces the underlying exception — including the
     * root cause, which is what distinguishes "the password was rejected" from
     * "we can't reach the mail server at all".
     */
    public String probe(String to) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("ClearStock delivery test");
            message.setText("Delivery test — if this arrived, email is working.");
            mailSender.send(message);
            return "OK";
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) root = root.getCause();
            log.error("Email probe failed", e);
            return e.getClass().getSimpleName() + ": " + e.getMessage()
                    + " || root: " + root.getClass().getName() + ": " + root.getMessage();
        }
    }

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

    public void sendDealAlertEmail(String to, String buyerName, String productName,
                                   String category, BigDecimal price,
                                   String sellerName, Long listingId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("New ClearStock Deal Alert");
            message.setText(
                    "Hi " + buyerName + ",\n\n" +
                    "A new listing matches your deal alert!\n\n" +
                    "Product: " + productName + "\n" +
                    "Category: " + category + "\n" +
                    "Price: GHS " + price + "\n" +
                    "Seller: " + sellerName + "\n" +
                    "Listing ID: " + listingId + "\n\n" +
                    "Log in to ClearStock Ghana to view the full listing.\n\n" +
                    "— The ClearStock Ghana Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send deal alert email to {}: {}", to, e.getMessage());
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
