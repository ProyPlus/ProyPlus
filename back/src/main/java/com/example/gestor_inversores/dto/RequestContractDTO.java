package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.Currency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestContractDTO {

    @NotNull(message = "El ID del proyecto es obligatorio")
    private Long projectId;

    @NotNull(message = "El ID del inversor creador es obligatorio")
    private Long createdByInvestorId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    @NotNull(message = "La moneda es obligatoria")
    private Currency currency;

    @DecimalMin(value = "0.00", message = "El profit 1 año debe ser >= 0")
    private BigDecimal profit1Year;

    @DecimalMin(value = "0.00", message = "El profit 2 años debe ser >= 0")
    private BigDecimal profit2Years;

    @DecimalMin(value = "0.00", message = "El profit 3 años debe ser >= 0")
    private BigDecimal profit3Years;
}
