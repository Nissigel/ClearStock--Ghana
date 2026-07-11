package com.clearstock.backend.transactions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;
import java.util.Map;

@Service
@Slf4j
public class PaystackService {

    private static final String BASE_URL = "https://api.paystack.co";

    @Value("${paystack.secret.key}")
    private String secretKey;

    private final RestTemplate restTemplate;

    public PaystackService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @SuppressWarnings("unchecked")
    public String initializePayment(String email, long amountInPesewas, String reference) {
        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                    Map.of("email", email, "amount", amountInPesewas, "reference", reference, "currency", "GHS"),
                    buildHeaders()
            );
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    BASE_URL + "/transaction/initialize", request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment gateway returned an error");
            }
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            return (String) data.get("authorization_url");
        } catch (RestClientException e) {
            log.error("Failed to initialize Paystack payment for reference {}: {}", reference, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment gateway unavailable");
        }
    }

    @SuppressWarnings("unchecked")
    public boolean verifyPayment(String reference) {
        try {
            HttpEntity<Void> request = new HttpEntity<>(buildHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(
                    BASE_URL + "/transaction/verify/" + reference,
                    HttpMethod.GET, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return false;
            }
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            return "success".equals(data.get("status"));
        } catch (RestClientException e) {
            log.error("Failed to verify Paystack payment for reference {}: {}", reference, e.getMessage());
            return false;
        }
    }

    public boolean isValidSignature(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secretKey.getBytes(), "HmacSHA512"));
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes()));
            return expected.equals(signature);
        } catch (Exception e) {
            log.error("Error validating Paystack webhook signature", e);
            return false;
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + secretKey);
        return headers;
    }
}
