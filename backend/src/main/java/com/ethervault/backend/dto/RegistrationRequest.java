package com.ethervault.backend.dto;

import lombok.Data;

@Data
public class RegistrationRequest {
    private String name;
    private String email;
    private String password;
    private String walletAddress;
}
