package com.example.gestor_inversores.dto;

import lombok.Data;

@Data
public class PasswordResetRequestDTO {
    private String email;
    private String token;
    private String password;
}
