package com.example.gestor_inversores.service.currency;

import com.example.gestor_inversores.dto.CurrencyConversionDTO;
import com.example.gestor_inversores.exception.CurrencyConversionException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CurrencyConversionService {

    @Value("${exchangerate.api.key}")
    private String apiKey; // Key en application.properties

    private static final String API_URL = "https://v6.exchangerate-api.com/v6/%s/latest/%s";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Obtiene la tasa de conversión del día entre dos monedas
     *
     * @param from Moneda origen (ej: "CNY")
     * @param to   Moneda destino (ej: "USD")
     * @return DTO con la tasa de conversión
     */
    public CurrencyConversionDTO getConversionRate(String from, String to) {
        String url = String.format(API_URL, apiKey, from);

        String response = restTemplate.getForObject(url, String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode rates = root.path("conversion_rates");

            if (rates.isMissingNode() || !rates.has(to)) {
                throw new CurrencyConversionException(
                        "No se encontró la tasa de conversión de " + from + " a " + to
                );
            }

            BigDecimal rate = rates.get(to).decimalValue();

            return new CurrencyConversionDTO(from, to, rate);

        } catch (Exception e) {
            throw new CurrencyConversionException(
                    "Error al obtener la tasa de conversión de " + from + " a " + to
            );
        }
    }
}
