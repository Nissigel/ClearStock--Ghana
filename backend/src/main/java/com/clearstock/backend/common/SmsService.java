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
 */
@Service
@Slf4j
public class SmsService {

    private static final String SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";

    @Value("${arkesel.api.key:}")
    private String apiKey;

    @Value("${arkesel.sender.id:ClearStock}")
    private String senderId;

    private final RestTemplate restTemplate;

    public SmsService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    /** @return true only if the SMS gateway accepted the OTP for delivery. */
    @SuppressWarnings("rawtypes")
    public boolean sendOtpSms(String phone, String otp) {
        if (!StringUtils.hasText(apiKey)) {
            return false; // SMS not configured — caller falls back.
        }
        String recipient = normalise(phone);
        if (recipient == null) {
            return false;
        }

        String message = "Your ClearStock verification code is " + otp
                + ". It expires in 5 minutes. Do not share it with anyone.";
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
            boolean accepted = response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null
                    && "success".equalsIgnoreCase(String.valueOf(response.getBody().get("status")));
            if (!accepted) {
                log.warn("SMS gateway did not accept OTP for {}: {}", recipient, response.getBody());
            }
            return accepted;
        } catch (RestClientException e) {
            log.warn("Failed to send OTP SMS to {}: {}", recipient, e.getMessage());
            return false;
        }
    }

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
