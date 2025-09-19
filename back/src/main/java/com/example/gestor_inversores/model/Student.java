package com.example.gestor_inversores.model;

import com.example.gestor_inversores.model.enums.DegreeStatus;
import com.example.gestor_inversores.model.enums.University;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student extends UserSec{


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
    @Enumerated(EnumType.STRING)
    private University university;

    @NotBlank(message = "La carrera es obligatoria")
    private String career;

    @NotNull(message = "El estado de la carrera es obligatorio")
    @Enumerated(EnumType.STRING)
    private DegreeStatus degreeStatus;

    @Pattern(regexp = "^(https?://).*$", message = "Debe ser una URL válida")
    private String linkedinUrl;

    @Size(max = 500, message = "La descripción puede tener hasta 500 caracteres")
    private String description;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id",referencedColumnName = "idAddress")
    private Address address;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "student_project",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "project_id"))
    private Set<Project> projectsList = new HashSet<>();

    @OneToMany(mappedBy = "confirmedBy")
    private Set<Investment> confirmedInvestments = new HashSet<>();

}
