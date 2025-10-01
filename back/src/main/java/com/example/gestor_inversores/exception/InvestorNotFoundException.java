package com.example.gestor_inversores.exception;

public class InvestorNotFoundException extends RuntimeException {
    public InvestorNotFoundException(String message) {
        super(message);
    }
}
