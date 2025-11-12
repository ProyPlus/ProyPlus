package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetRequestDTO {

    @NotBlank(message = "El token no puede estar vacío")
    private String token;

    @NotBlank(message = "La contraseña no puede estar vacía")
    @Size(min = 6, message = "La contraseña debe tener al menos 4 caracteres")
    private String password;
}
