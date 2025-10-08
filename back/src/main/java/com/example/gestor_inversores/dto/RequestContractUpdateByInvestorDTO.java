package com.example.gestor_inversores.dto;

import com.example.gestor_inversores.model.enums.Currency;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestContractUpdateByInvestorDTO {
    private BigDecimal amount;
    private Currency currency;
    private BigDecimal profit1Year;
    private BigDecimal profit2Years;
    private BigDecimal profit3Years;
}

