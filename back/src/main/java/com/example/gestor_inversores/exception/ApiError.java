package com.example.gestor_inversores.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class ApiError {

    private final String message;
    private final HttpStatus httpStatus;
    private final LocalDateTime timestamp;
}
