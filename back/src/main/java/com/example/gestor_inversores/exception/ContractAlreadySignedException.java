package com.example.gestor_inversores.exception;

public class ContractAlreadySignedException extends RuntimeException {
    public ContractAlreadySignedException(String message) {
        super(message);
    }
}
