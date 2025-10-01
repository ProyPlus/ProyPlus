package com.example.gestor_inversores.exception;

public class CuitAlreadyExistsException extends RuntimeException {
    public CuitAlreadyExistsException(String message) {
        super(message);
    }
}
