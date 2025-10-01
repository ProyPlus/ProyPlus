package com.example.gestor_inversores.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestProjectCurrentGoalUpdateDTO {

    @NotNull(message = "El currentGoal no puede ser nulo")
    private BigDecimal currentGoal;

}
