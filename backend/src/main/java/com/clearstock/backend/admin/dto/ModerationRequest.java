package com.clearstock.backend.admin.dto;

import lombok.Data;

/**
 * Why an admin took an action. Required when rejecting or suspending, so the
 * person on the receiving end can be told what to fix.
 */
@Data
public class ModerationRequest {
    private String reason;
    private String note;
}
