package com.clearstock.backend.common;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Temporary: reports why email delivery is failing.
 *
 * OTP emails have been failing silently and the reason is only visible in the
 * host's logs. This reports the underlying error so the cause can be settled —
 * a rejected password looks nothing like a blocked connection, and the fixes
 * are completely different.
 *
 * Requires authentication, never reveals the password, and should be deleted
 * once delivery works.
 */
@RestController
@RequestMapping("/diagnostics")
@RequiredArgsConstructor
public class MailDiagnosticController {

    private final EmailService emailService;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:}")
    private String port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @GetMapping("/mail")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkMail(
            @RequestParam String to) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("host", host);
        report.put("port", port);
        report.put("username", username);
        // Never the password itself — just enough to spot a blank value or
        // stray whitespace from pasting.
        report.put("passwordLength", password == null ? 0 : password.length());
        report.put("passwordHasSpaces", password != null && password.contains(" "));
        report.put("result", emailService.probe(to));

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    /**
     * Which mail relays this host can actually reach. SMTP blocks are applied
     * per-port, so this shows whether any relay is usable at all before
     * committing to a provider.
     */
    @GetMapping("/ports")
    public ResponseEntity<ApiResponse<Map<String, String>>> checkPorts() {
        Map<String, String> results = new LinkedHashMap<>();
        String[][] targets = {
                {"smtp.gmail.com", "587"},
                {"smtp.gmail.com", "465"},
                {"smtp-relay.brevo.com", "587"},
                {"smtp-relay.brevo.com", "2525"},
                {"smtp.sendgrid.net", "2525"},
                // Plain HTTPS, to confirm outbound traffic works at all and
                // that only mail ports are affected.
                {"api.brevo.com", "443"},
        };
        for (String[] target : targets) {
            results.put(
                    target[0] + ":" + target[1],
                    PortProbe.check(target[0], Integer.parseInt(target[1]), 6000));
        }
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
