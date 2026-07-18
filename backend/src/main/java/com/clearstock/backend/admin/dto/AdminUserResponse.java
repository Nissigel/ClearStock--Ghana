package com.clearstock.backend.admin.dto;

import com.clearstock.backend.user.AccountStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String region;
    private String cityTown;
    /** SELLER when they have a shop, otherwise BUYER. */
    private String role;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
}
