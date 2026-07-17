package com.clearstock.backend.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {

    private Long id;
    private String phone;
    private String name;
    private String email;
    private Boolean preferEmail;
    private String profileImageUrl;
    private String region;
    private String cityTown;
    private LocalDateTime createdAt;
}
