package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.DegreeStatus;
import com.example.gestor_inversores.model.enums.University;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
        import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestStudentDTO {

    // ----- Campos de UserSec -----
    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 4 caracteres")
    private String password;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email no válido")
    private String email;

    private String photoUrl;

    // ----- Campos de Student -----
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede superar 100 caracteres")
    private String lastName;

    @NotBlank(message = "El DNI es obligatorio")
    @Size(max = 20, message = "El DNI no puede superar 20 caracteres")
    private String dni;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 50, message = "El teléfono no puede superar 50 caracteres")
    private String phone;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser anterior a la fecha actual")
    private LocalDate dateOfBirth;

    @NotNull(message = "La universidad es obligatoria")
    private University university;

    @NotBlank(message = "La carrera es obligatoria")
    private String career;

    @NotNull(message = "El estado de la carrera es obligatorio")
    private DegreeStatus degreeStatus;

    @Pattern(regexp = "^(https?://.*|linkedin\\.com/.*)?$", message = "Si se proporciona, debe ser una URL válida")
    private String linkedinUrl;

    @Size(max = 500, message = "La descripción puede tener hasta 500 caracteres")
    private String description;

    @Valid
    private AddressDTO address;
}
