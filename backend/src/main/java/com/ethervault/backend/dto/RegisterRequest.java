package com.ethervault.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String walletAddress;
    // role comes from endpoint path, not user input
}
