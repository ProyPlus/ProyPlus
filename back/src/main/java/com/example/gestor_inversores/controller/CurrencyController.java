package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.CurrencyConversionDTO;
import com.example.gestor_inversores.service.currency.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyConversionService conversionService;

    @GetMapping("/api/currency/convert")
    public CurrencyConversionDTO convert(@RequestParam String from, @RequestParam String to) {
        return conversionService.getConversionRate(from, to);
    }
}
