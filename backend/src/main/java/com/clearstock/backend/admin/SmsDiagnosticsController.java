package com.clearstock.backend.admin;

import com.clearstock.backend.common.ApiResponse;
import com.clearstock.backend.common.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Lets an admin check whether Arkesel SMS is configured, and fire a single test
 * text, without having to sign up a fake account to trigger an OTP.
 *
 * Admin-only: it reveals configuration and can send an SMS, so it sits behind
 * the same role guard as the rest of the dashboard (/admin/** -> ROLE_ADMIN).
 */
@Slf4j
@RestController
@RequestMapping("/admin/sms")
@RequiredArgsConstructor
public class SmsDiagnosticsController {

    private final SmsService smsService;

    /** Reports configuration without ever echoing the API key back. */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        boolean configured = smsService.isConfigured();
        String note;
        if (!configured) {
            note = "ARKESEL_API_KEY is not set — no SMS is sent, so OTPs fall back "
                    + "to the on-screen code.";
        } else if (smsService.isSandbox()) {
            note = "Sandbox mode is ON — codes are logged, not delivered. Set "
                    + "ARKESEL_SANDBOX=false for real texts.";
        } else {
            note = "SMS is live. The sender ID must be approved by Arkesel or "
                    + "delivery will be rejected.";
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "apiKeyConfigured", configured,
                "senderId", smsService.getSenderId(),
                "sandbox", smsService.isSandbox(),
                "note", note
        )));
    }

    /** Sends a test SMS to the given number and returns Arkesel's response. */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> test(@RequestParam String to) {
        SmsService.SmsOutcome outcome = smsService.sendTest(to);
        return ResponseEntity.ok(ApiResponse.success(
                outcome.accepted()
                        ? "Test SMS accepted for delivery"
                        : "Test SMS not sent — see the detail field and the server logs",
                Map.of(
                        "to", to,
                        "accepted", outcome.accepted(),
                        "status", outcome.status() == null ? "(none)" : outcome.status(),
                        "detail", outcome.detail() == null ? "(none)" : outcome.detail(),
                        "senderId", smsService.getSenderId()
                )));
    }
}
