package com.clearstock.backend.transactions.dto;

import lombok.Data;

@Data
public class WebhookRequest {
    private String event;
    private WebhookData data;

    @Data
    public static class WebhookData {
        private String status;
        private String reference;
        private Long amount;
    }
}
