package com.example.gestor_inversores.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CurrencyConversionDTO {
    private String fromCurrency; // Ej: "CNY"
    private String toCurrency;   // Ej: "USD"
    private BigDecimal rate;     // Valor de conversión del día
}