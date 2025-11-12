package com.example.gestor_inversores.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class StudentDesactivationException extends RuntimeException {
    public StudentDesactivationException(String message) {
        super(message);
    }
}
