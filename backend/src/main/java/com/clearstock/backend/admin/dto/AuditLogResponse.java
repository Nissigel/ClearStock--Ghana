package com.clearstock.backend.admin.dto;

import com.clearstock.backend.admin.AuditAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private AuditAction action;
    private String adminName;
    private Long adminId;
    private String targetType;
    private Long targetId;
    private String targetLabel;
    private String note;
    private LocalDateTime createdAt;
}
