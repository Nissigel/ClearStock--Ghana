package com.clearstock.backend.admin.dto;

import lombok.Data;

/** The message an admin sends to a user (seller or buyer) from the dashboard. */
@Data
public class ContactUserRequest {
    private String message;
}
