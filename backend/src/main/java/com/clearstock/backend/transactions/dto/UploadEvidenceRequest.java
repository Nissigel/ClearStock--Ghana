package com.clearstock.backend.transactions.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UploadEvidenceRequest {

    @NotEmpty(message = "At least one image URL is required")
    private List<String> imageUrls;
}
