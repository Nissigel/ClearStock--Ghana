package com.clearstock.backend.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Sends transactional SMS through Arkesel (https://arkesel.com), a Ghanaian SMS
 * gateway. The API key comes from the ARKESEL_API_KEY environment variable; when
 * it isn't set the service reports "not sent" so callers fall back to email or
 * the on-screen code, and no secret is committed to the repo.
 *
 * Set ARKESEL_SANDBOX=true to log codes instead of sending them — useful for
 * testing the flow without spending credits or needing an approved sender ID.
 */
@Service
@Slf4j
public class SmsService {

    private static final String SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";

    @Value("${arkesel.api.key:}")
    private String apiKey;

    @Value("${arkesel.sender.id:ClearStock}")
    private String senderId;

    /**
     * When true, messages are logged instead of sent, so the integration can be
     * exercised end-to-end without spending SMS credits or having an approved
     * live sender ID. The OTP still reaches the tester via the on-screen
     * fallback, because a sandbox send is reported as "not delivered".
     */
    @Value("${arkesel.sandbox:false}")
    private boolean sandbox;

    private final RestTemplate restTemplate;

    public SmsService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    /** True once ARKESEL_API_KEY is set — i.e. real texts can be sent. */
    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public String getSenderId() {
        return senderId;
    }

    /** @return true only if the SMS gateway accepted the OTP for delivery. */
    public boolean sendOtpSms(String phone, String otp) {
        String message = "Your ClearStock verification code is " + otp
                + ". It expires in 5 minutes. Do not share it with anyone.";
        return dispatch(phone, message).accepted();
    }

    /**
     * Sends a short test message and returns the gateway's response, so an admin
     * can confirm the API key and sender ID work without signing up a real
     * account. Not part of the normal OTP path.
     */
    public SmsOutcome sendTest(String phone) {
        return dispatch(phone, "ClearStock SMS test — your Arkesel setup is working.");
    }

    /** Sends one message and reports what the gateway said. */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private SmsOutcome dispatch(String phone, String message) {
        if (!isConfigured()) {
            return new SmsOutcome(false, "not-configured",
                    "ARKESEL_API_KEY is not set, so no SMS was sent.");
        }
        String recipient = normalise(phone);
        if (recipient == null) {
            return new SmsOutcome(false, "invalid-recipient",
                    "Could not read a valid phone number from '" + phone + "'.");
        }
        // Sandbox: don't spend credits or require an approved sender ID. Report
        // "not delivered" so the caller keeps the on-screen code fallback, and
        // log the message so a tester can still see what would have gone out.
        if (sandbox) {
            log.info("[sms] SANDBOX on — not sending to {}. Would have sent: {}", recipient, message);
            return new SmsOutcome(false, "sandbox",
                    "Sandbox mode is on: the message was logged, not sent.");
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                    Map.of(
                            "sender", senderId,
                            "message", message,
                            "recipients", List.of(recipient)
                    ),
                    headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(SEND_URL, request, Map.class);
            Object status = response.getBody() == null ? null : response.getBody().get("status");
            boolean accepted = response.getStatusCode().is2xxSuccessful()
                    && "success".equalsIgnoreCase(String.valueOf(status));
            if (accepted) {
                log.info("[sms] Arkesel accepted message for {} (sender '{}')", recipient, senderId);
            } else {
                // The body carries Arkesel's reason, e.g. an unapproved sender
                // ID or insufficient balance — log it so it can be diagnosed.
                log.warn("[sms] Arkesel did not accept message for {} (sender '{}'): {}",
                        recipient, senderId, response.getBody());
            }
            return new SmsOutcome(accepted, String.valueOf(status),
                    accepted ? "Accepted for delivery."
                             : "Gateway did not accept the message: " + response.getBody());
        } catch (RestClientException e) {
            log.warn("[sms] Failed to reach Arkesel for {}: {}", recipient, e.getMessage());
            return new SmsOutcome(false, "error", e.getMessage());
        }
    }

    /** Outcome of a single send attempt, used for logging and diagnostics. */
    public record SmsOutcome(boolean accepted, String status, String detail) {}

    /** Normalise a Ghana number to international 233XXXXXXXXX form. */
    private String normalise(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("233")) {
            return digits;
        }
        if (digits.startsWith("0")) {
            return "233" + digits.substring(1);
        }
        if (digits.length() == 9) {
            return "233" + digits;
        }
        return digits;
    }
}
