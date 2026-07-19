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
    private final BrevoMailClient brevo;

    /**
     * Tries the HTTPS API first, then SMTP.
     *
     * The order matters: the deployment host blocks outbound SMTP, so on the
     * server only the API can succeed, while a developer running locally with
     * no API key still gets working mail through SMTP.
     */
    private boolean send(String to, String subject, String body) {
        if (brevo.send(to, subject, body)) return true;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[mail] sent to {} via SMTP", to);
            return true;
        } catch (Exception e) {
            log.warn("[mail] could not send '{}' to {}: {}", subject, to, e.getMessage());
            return false;
        }
    }

    public boolean sendOtpEmail(String to, String otp) {
        return send(to, "Your ClearStock OTP",
                "Your ClearStock verification code is: " + otp
                        + "\n\nThis code expires in 5 minutes. Do not share it with anyone."
                        + "\n\n— The ClearStock Ghana Team");
    }

    public void sendDealAlertEmail(String to, String buyerName, String productName,
                                   String category, BigDecimal price,
                                   String sellerName, Long listingId) {
        send(to, "New ClearStock Deal Alert",
                "Hi " + buyerName + ",\n\n"
                        + "A new listing matches your deal alert!\n\n"
                        + "Product: " + productName + "\n"
                        + "Category: " + category + "\n"
                        + "Price: GHS " + price + "\n"
                        + "Seller: " + sellerName + "\n"
                        + "Listing ID: " + listingId + "\n\n"
                        + "Log in to ClearStock Ghana to view the full listing.\n\n"
                        + "— The ClearStock Ghana Team");
    }

    public void sendWelcomeEmail(String to, String name) {
        send(to, "Welcome to ClearStock Ghana",
                "Hi " + name + ",\n\n"
                        + "Welcome to ClearStock Ghana! Your account has been created successfully.\n\n"
                        + "You can now browse and purchase cleared stock from sellers across Ghana.\n\n"
                        + "— The ClearStock Ghana Team");
    }
}
