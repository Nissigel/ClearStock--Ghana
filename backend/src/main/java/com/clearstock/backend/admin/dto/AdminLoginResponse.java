package com.clearstock.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminLoginResponse {
    private String token;
    private AdminResponse admin;
}
