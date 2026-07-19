package com.clearstock.backend.admin;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.common.BrevoMailClient;
import com.clearstock.backend.common.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Lets an admin check whether email is actually configured, and send a test
 * message, without signing up a fake account and firing an SMS at a real
 * phone number to do it.
 *
 * Admin-only: it reveals configuration and can send mail, so it sits behind
 * the same role guard as the rest of the dashboard.
 */
@Slf4j
@RestController
@RequestMapping("/admin/mail")
@RequiredArgsConstructor
public class MailDiagnosticsController {

    private final BrevoMailClient brevo;
    private final EmailService emailService;

    @Value("${mail.from.address:}")
    private String fromAddress;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    /** Reports configuration without ever echoing the API key back. */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "httpsApiConfigured", brevo.isConfigured(),
                "fromAddress", fromAddress == null || fromAddress.isBlank()
                        ? "(not set)" : fromAddress,
                "smtpHost", smtpHost == null || smtpHost.isBlank()
                        ? "(not set)" : smtpHost,
                "note", brevo.isConfigured()
                        ? "Email will be sent over HTTPS."
                        : "BREVO_API_KEY or MAIL_FROM_ADDRESS is missing — the server "
                          + "will fall back to SMTP, which this host blocks."
        )));
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> test(@RequestParam String to) {
        boolean sent = emailService.sendOtpEmail(to, "123456");
        return ResponseEntity.ok(ApiResponse.success(
                sent ? "Test email accepted for delivery" : "Sending failed — check the logs",
                Map.of("to", to, "sent", sent,
                        "via", brevo.isConfigured() ? "Brevo HTTPS API" : "SMTP fallback")));
    }
}
