package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestInvestmentUpdateDTO {

    private BigDecimal amount;
    private Currency currency;
    private Long confirmedByStudentId; // estudiante que confirma
    private InvestmentStatus status;   // RECEIVED o NOT_RECEIVED

}
