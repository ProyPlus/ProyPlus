package com.example.gestor_inversores.model;

import com.example.gestor_inversores.model.enums.ProjectStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private BigDecimal budgetGoal;

    @NotNull(message = "El presupuesto actual es obligatorio")
    @PositiveOrZero(message = "El presupuesto actual debe ser mayor o igual a cero")
    private BigDecimal currentGoal;

    @NotNull(message = "El estado del proyecto es obligatorio")
    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;

    @NotNull(message = "La fecha de finalización estimada es obligatoria")
    @FutureOrPresent(message = "La fecha de inicio no puede ser anterior a hoy")
    private LocalDate estimatedEndDate;

    private LocalDate endDate;

    @ManyToMany(mappedBy = "projectsList", fetch = FetchType.EAGER)
    @Builder.Default
    private Set<Student> students = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<ProjectDocument> documents = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "tag_id")
    private ProjectTag projectTag;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Investment> investments = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Earning> earnings = new HashSet<>();
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
    private LocalDateTime deletedAt;

}
