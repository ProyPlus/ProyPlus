package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.Currency;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseInvestmentDTO {

    private Long idInvestment;
    private InvestmentStatus status;
    private BigDecimal amount;
    private Currency currency;
    private LocalDate createdAt;
    private LocalDate confirmedAt;
    private Long generatedById;
    private Long projectId;
    private Long confirmedByStudentId;




}
