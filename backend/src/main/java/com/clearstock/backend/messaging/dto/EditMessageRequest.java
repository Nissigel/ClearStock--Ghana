package com.clearstock.backend.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EditMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    private String messageContent;
}
