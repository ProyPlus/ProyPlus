package com.example.gestor_inversores.model;

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
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProject;

    @NotNull(message = "El nombre del proyecto es obligatorio")
    @Size(max = 100, message = "El nombre del proyecto no puede superar 100 caracteres")
    private String name;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    private String description;

    @NotNull(message = "El presupuesto objetivo es obligatorio")
    @PositiveOrZero(message = "El presupuesto objetivo debe ser mayor o igual a cero")
    private Double budgetGoal;

    @NotNull(message = "El presupuesto actual es obligatorio")
    @PositiveOrZero(message = "El presupuesto actual debe ser mayor o igual a cero")
    private Double currentGoal;

    @NotBlank(message = "El estado del proyecto es obligatorio")
    private String status;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    @NotNull(message = "La fecha de finalización estimada es obligatoria")
    @FutureOrPresent(message = "La fecha de inicio no puede ser anterior a hoy")
    private LocalDate estimatedEndDate;

    private LocalDate endDate;

    @ManyToMany(mappedBy = "projectsList", fetch = FetchType.EAGER)
    private Set<Student> students = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Set<ProjectDocument> documents = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "tag_id")
    private ProjectTag projectTag;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private Set<Investment> investments = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private Set<Earning> earnings = new HashSet<>();

}
