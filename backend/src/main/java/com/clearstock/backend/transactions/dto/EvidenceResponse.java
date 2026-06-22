package com.clearstock.backend.transactions.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EvidenceResponse {

    private Long id;
    private String imageUrl;
    private Long uploadedByUserId;
    private LocalDateTime createdAt;
}
