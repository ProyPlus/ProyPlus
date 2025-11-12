package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.exception.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.List;

@RestControllerAdvice
public class ControllerHandler extends ResponseEntityExceptionHandler {

    // --- 404 NOT FOUND ---
    @ExceptionHandler({
            OwnerNotFoundException.class, InvestmentNotFoundException.class,
            InvestorNotFoundException.class, StudentNotFoundException.class,
            UserNotFoundException.class, EmailNotFoundException.class,
            ProjectNotFoundException.class, ContractNotFoundException.class,
            EarningNotFoundException.class, RoleNotFoundException.class,
            PermissionNotFoundException.class, DocumentFileNotFoundException.class,
            ProjectTagException.class
    })
    public ResponseEntity<ApiError> handleNotFoundExceptions(RuntimeException ex) {
        ApiError apiError = new ApiError("Recurso no encontrado: " + ex.getMessage(), HttpStatus.NOT_FOUND, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    // --- 409 CONFLICT ---
    @ExceptionHandler({
            UsernameAlreadyExistsException.class, EmailAlreadyExistsException.class,
            DniAlreadyExistsException.class, CuitAlreadyExistsException.class,
            ExistingProjectException.class, ContractAlreadySignedException.class,
            ContractCannotBeModifiedException.class, InvalidContractOperationException.class,
            RoleAlreadyExistsException.class, // Añadida
            PermissionAlreadyExistsException.class, // Añadida
            StudentDesactivationException.class, // Añadida
            InvestorDesactivationException.class // Añadida
    })
    public ResponseEntity<ApiError> handleConflictExceptions(RuntimeException ex) {
        ApiError apiError = new ApiError("Conflicto: " + ex.getMessage(), HttpStatus.CONFLICT, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    // --- 400 BAD REQUEST ---
    @ExceptionHandler({
            InvalidPasswordException.class, InvalidProjectException.class,
            CreateException.class, UpdateException.class,
            DeleteException.class, BusinessException.class
    })
    public ResponseEntity<ApiError> handleBadRequestExceptions(RuntimeException ex) {
        ApiError apiError = new ApiError("Petición inválida: " + ex.getMessage(), HttpStatus.BAD_REQUEST, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // --- 401 UNAUTHORIZED ---
    @ExceptionHandler({
            BadCredentialsException.class, InvalidTokenException.class,
            ExpiredTokenException.class, DisabledException.class // Añadida
    })
    public ResponseEntity<ApiError> handleUnauthorizedExceptions(RuntimeException ex) {
        ApiError apiError = new ApiError("No autorizado: " + ex.getMessage(), HttpStatus.UNAUTHORIZED, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    // --- 403 FORBIDDEN ---
    @ExceptionHandler(UnauthorizedOperationException.class)
    public ResponseEntity<ApiError> handleForbiddenException(UnauthorizedOperationException ex) {
        ApiError apiError = new ApiError("Acceso denegado: " + ex.getMessage(), HttpStatus.FORBIDDEN, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    // --- 500 INTERNAL SERVER ERROR ---
    @ExceptionHandler({
            EmailSendException.class, CurrencyConversionException.class,
            DocumentFileException.class, Exception.class // Genérico como último recurso
    })
    public ResponseEntity<ApiError> handleInternalServerExceptions(Exception ex) {
        ApiError apiError = new ApiError("Error interno del servidor: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // --- MANEJADOR DE VALIDACIONES (SOBREESCRITO) ---
    @Override
    public ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        BindingResult bindingResult = ex.getBindingResult();
        List<ObjectError> errorList = bindingResult.getAllErrors();
        StringBuilder errorMessage = new StringBuilder();

        for (ObjectError objectError : errorList) {
            if (objectError instanceof FieldError fieldError) {
                errorMessage.append(fieldError.getField()).append(": ").append(fieldError.getDefaultMessage()).append(". ");
            } else {
                errorMessage.append(objectError.getDefaultMessage()).append(". ");
            }
        }

        ApiError apiError = new ApiError(errorMessage.toString(), HttpStatus.BAD_REQUEST, LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }
}
