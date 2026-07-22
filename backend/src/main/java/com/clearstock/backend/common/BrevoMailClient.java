package com.clearstock.backend.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Sends mail over Brevo's HTTPS API instead of SMTP.
 *
 * The deployment host blocks outbound SMTP entirely — ports 25, 465 and 587
 * never leave its network, so a Gmail app password could be perfectly correct
 * and the connection would still time out before anything authenticated. That
 * is not a credentials problem and no amount of rotating passwords fixes it.
 *
 * This talks to port 443, which is never blocked, so it works from the same
 * host that could not open an SMTP socket.
 */
@Slf4j
@Component
public class BrevoMailClient {

    private static final String ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate rest = new RestTemplate();

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${mail.from.address:}")
    private String fromAddress;

    @Value("${mail.from.name:ClearStock Ghana}")
    private String fromName;

    /** False when no API key is set, so the caller can fall back to SMTP. */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && fromAddress != null && !fromAddress.isBlank();
    }

    public boolean send(String to, String subject, String body) {
        if (!isConfigured()) return false;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);
            headers.set("accept", "application/json");

            Map<String, Object> payload = Map.of(
                    "sender", Map.of("name", fromName, "email", fromAddress),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "textContent", body
            );

            ResponseEntity<String> response =
                    rest.postForEntity(ENDPOINT, new HttpEntity<>(payload, headers), String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[mail] sent to {} via Brevo", to);
                return true;
            }
            log.warn("[mail] Brevo refused the message to {}: {} {}",
                    to, response.getStatusCode(), response.getBody());
            return false;
        } catch (Exception e) {
            // The body of a 4xx carries the real reason — an unverified sender
            // address is the usual one — so it is logged rather than swallowed.
            log.warn("[mail] Brevo send to {} failed: {}", to, e.getMessage());
            return false;
        }
    }
}
