package com.clearstock.backend.messaging.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartConversationRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;
}
