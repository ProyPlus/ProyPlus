package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.Address;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RequestInvestorUpdateByAdminDTO {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe ser un email válido")
    private String email;

    @NotBlank(message = "CUIT es obligatorio")
    @Size(min = 11, max = 11, message = "CUIT debe tener 11 caracteres")
    private String cuit;

    @NotBlank(message = "Nombre del contacto es obligatorio")
    private String contactPerson;

    @NotBlank(message = "Teléfono es obligatorio")
    private String phone;

    @Size(max = 100, message = "El sitio web no puede superar 100 caracteres")
    private String webSite;

    @Pattern(regexp = "^(https?://.*|linkedin\\.com/.*)?$", message = "Si se proporciona, debe ser una URL válida")
    private String linkedinUrl;

    @Valid
    private Address address;

    private Boolean enabled;
    private Boolean accountNotExpired;
    private Boolean accountNotLocked;
    private Boolean credentialNotExpired;
}
