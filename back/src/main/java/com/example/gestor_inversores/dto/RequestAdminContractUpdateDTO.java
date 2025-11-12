package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.ContractStatus;
import com.example.gestor_inversores.model.enums.Currency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestAdminContractUpdateDTO {
    private ContractStatus status;
}
