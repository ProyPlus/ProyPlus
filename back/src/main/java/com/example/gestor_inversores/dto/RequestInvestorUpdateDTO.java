package com.example.gestor_inversores.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestInvestorUpdateDTO {

    // Para PATCH, los campos son opcionales, por lo que se quita @NotBlank
    // pero se mantienen las validaciones de formato si el campo es proporcionado.

    @Size(min = 3, max = 50, message = "Si se proporciona, el username debe tener entre 3 y 50 caracteres")
    private String username;

    @Email(message = "Si se proporciona, el email debe tener un formato válido")
    private String email;

    private String photoUrl;

    @Size(min = 11, max = 11, message = "Si se proporciona, el CUIT debe tener 11 caracteres")
    private String cuit;

    private String contactPerson;

    @Pattern(regexp = "\\+?\\d{8,15}", message = "Si se proporciona, el teléfono es inválido")
    private String phone;

    @Size(max = 100, message = "El sitio web no puede superar 100 caracteres")
    private String webSite;

    @Pattern(regexp = "^(https?://.*|linkedin\\.com/.*)?$", message = "Si se proporciona, debe ser una URL válida")
    private String linkedinUrl;

    @Valid // Si se proporciona una dirección, debe ser validada en cascada
    private AddressDTO address;
}
