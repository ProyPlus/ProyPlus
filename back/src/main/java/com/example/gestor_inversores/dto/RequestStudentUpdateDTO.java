package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.DegreeStatus;
import com.example.gestor_inversores.model.enums.University;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RequestStudentUpdateDTO {

    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email no válido")
    private String email;
    private String photoUrl;

    // Campos específicos de Student
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

    @Pattern(regexp = "^(https?://).*$", message = "Debe ser una URL válida")
    private String linkedinUrl;

    @Size(max = 500, message = "La descripción puede tener hasta 500 caracteres")
    private String description;

    // Dirección opcional para patch
    private AddressDTO address;

}
