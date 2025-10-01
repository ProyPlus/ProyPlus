package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestInvestorUpdateDTO {

    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email no válido")
    private String email;

    private String photoUrl;

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
