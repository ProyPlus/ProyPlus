package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.InvestmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestInvestmentStatusDTO {

    @NotNull(message = "El ID del estudiante es obligatorio")
    private Long confirmedByStudentId;

    @NotNull(message = "El estado es obligatorio")
    private InvestmentStatus status;   // RECEIVED o NOT_RECEIVED
}
