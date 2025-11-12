package com.example.gestor_inversores.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InvestorDesactivationException extends RuntimeException {
    public InvestorDesactivationException(String message) {
        super(message);
    }
}
