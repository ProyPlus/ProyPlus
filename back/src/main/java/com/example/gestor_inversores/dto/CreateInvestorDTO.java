package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateInvestorDTO {

    // ----- Campos de User -----
    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 4, message = "La contraseña debe tener al menos 4 caracteres")
    private String password;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email no válido")
    private String email;

    private String photoUrl;

    // ----- Campos de Investor -----
    @NotBlank(message = "CUIT es obligatorio")
    @Size(min = 11, max = 11, message = "CUIT debe tener 11 caracteres")
    private String cuit;

    @NotBlank(message = "Nombre del contacto es obligatorio")
    private String contactPerson;

    @NotBlank(message = "Teléfono es obligatorio")
    @Pattern(regexp = "\\+?\\d{8,15}", message = "Teléfono inválido")
    private String phone;

    @Size(max = 100, message = "El sitio web no puede superar 100 caracteres")
    private String webSite;

    private AddressDTO address;

}
