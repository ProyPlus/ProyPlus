package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.ProjectStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestProjectDTO {

    @NotBlank(message = "Must contain a value")
    @Size(min = 4, max = 100)
    private String name;
    @NotBlank(message = "Must contain a value")
    @Size(min = 20, max = 500)
    private String description;
    @NotNull(message = "It cannot be null")
    @PositiveOrZero(message = "The amount must be greater than or equal to zero")
    @Digits(integer = 12, fraction = 2, message = "The amount must have up to 12 whole digits and 2 decimal places")
    private BigDecimal budgetGoal;
    @NotNull(message = "Must contain a value")
    private ProjectStatus status;
    @NotNull(message = "It cannot be null")
    private LocalDate startDate;
    @NotNull(message = "It cannot be null")
    @FutureOrPresent(message = "The date must be current or future")
    private LocalDate estimatedEndDate;
    @NotNull(message = "It cannot be null")
    private Long ownerId;
    // IDs de los estudiantes adicionales que participan en el proyecto
    private Set<Long> studentIds;

}
