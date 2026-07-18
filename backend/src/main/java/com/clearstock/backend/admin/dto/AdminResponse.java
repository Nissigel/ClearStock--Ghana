package com.clearstock.backend.admin.dto;

import com.clearstock.backend.admin.AdminRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminResponse {
    private Long id;
    private String email;
    private String name;
    private AdminRole role;
    private Boolean active;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
