package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordResetRequestEmailDTO {

    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Email inválido")
    private String email;

}
