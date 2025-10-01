package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.exception.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.BadCredentialsException;
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

    @ExceptionHandler(value = {InvestmentNotFoundException.class})
    public ResponseEntity<ApiError> handleInvestmentNotFoundException(InvestmentNotFoundException ex) {
        HttpStatus httpStatus = HttpStatus.NOT_FOUND;
        ApiError apiError = new ApiError("Inversión no encontrada: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {InvestorNotFoundException.class})
    public ResponseEntity<ApiError> handleInvestorNotFoundException(InvestorNotFoundException ex) {
        HttpStatus httpStatus = HttpStatus.NOT_FOUND;
        ApiError apiError = new ApiError("Inversor no encontrado: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {StudentNotFoundException.class})
    public ResponseEntity<ApiError> handleStudentNotFoundException(StudentNotFoundException ex) {
        HttpStatus httpStatus = HttpStatus.NOT_FOUND;
        ApiError apiError = new ApiError("Estudiante no encontrado: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {BadCredentialsException.class})
    public ResponseEntity<ApiError> handleBadCredentialsException(BadCredentialsException ex) {
        HttpStatus httpStatus = HttpStatus.UNAUTHORIZED; // 401
        ApiError apiError = new ApiError("Credenciales inválidas: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {EmailNotFoundException.class})
    public ResponseEntity<ApiError> handleEmailNotFoundException(EmailNotFoundException ex) {
        HttpStatus httpStatus = HttpStatus.NOT_FOUND;
        ApiError apiError = new ApiError("Email no encontrado: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {InvalidTokenException.class, ExpiredTokenException.class})
    public ResponseEntity<ApiError> handleTokenExceptions(RuntimeException ex) {
        HttpStatus httpStatus = HttpStatus.UNAUTHORIZED;
        ApiError apiError = new ApiError("Token inválido: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {InvalidPasswordException.class})
    public ResponseEntity<ApiError> handleInvalidPasswordException(InvalidPasswordException ex) {
        HttpStatus httpStatus = HttpStatus.BAD_REQUEST;
        ApiError apiError = new ApiError("Contraseña inválida: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {MailException.class})
    public ResponseEntity<ApiError> handleMailException(MailException ex) {
        HttpStatus httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        ApiError apiError = new ApiError("Error al enviar el correo: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler({UsernameAlreadyExistsException.class, EmailAlreadyExistsException.class,})
    public ResponseEntity<ApiError> handleDuplicateUser(RuntimeException ex) {
        ApiError apiError = new ApiError(ex.getMessage(), HttpStatus.CONFLICT, LocalDateTime.now());
        return new ResponseEntity<>(apiError, apiError.getHttpStatus());
    }

    @ExceptionHandler(DniAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleDniAlreadyExistsException(RuntimeException ex) {
        ApiError apiError = new ApiError(ex.getMessage(), HttpStatus.CONFLICT, LocalDateTime.now());
        return new ResponseEntity<>(apiError, apiError.getHttpStatus());
    }

    @ExceptionHandler(CuitAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleCuitAlreadyExistsException(RuntimeException ex) {
        ApiError apiError = new ApiError(ex.getMessage(), HttpStatus.CONFLICT, LocalDateTime.now());
        return new ResponseEntity<>(apiError, apiError.getHttpStatus());
    }

    @ExceptionHandler(value = {ExistingProjectException.class})
    public ResponseEntity<ApiError> handleExistingProjectException(ExistingProjectException ex) {
        HttpStatus httpStatus = HttpStatus.CONFLICT;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {ProjectNotFoundException.class})
    public ResponseEntity<ApiError> handleProjectNotFoundException(ProjectNotFoundException ex) {
        HttpStatus httpStatus = HttpStatus.NOT_FOUND;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {InvalidProjectException.class})
    public ResponseEntity<ApiError> handleInvalidProjectException(InvalidProjectException ex) {
        HttpStatus httpStatus = HttpStatus.BAD_REQUEST;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {CreateException.class})
    public ResponseEntity<ApiError> handleCreateException(CreateException ex) {
        HttpStatus httpStatus = HttpStatus.BAD_REQUEST;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {UpdateException.class})
    public ResponseEntity<ApiError> handleUpdateException(UpdateException ex) {
        HttpStatus httpStatus = HttpStatus.BAD_REQUEST;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @ExceptionHandler(value = {Exception.class})
    public ResponseEntity<ApiError> handleException(Exception ex) {
        HttpStatus httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        ApiError apiError = new ApiError("Error: " + ex.getMessage(), httpStatus, LocalDateTime.now());
        return new ResponseEntity<>(apiError, httpStatus);
    }

    @Override
    public ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        BindingResult bindingResult = ex.getBindingResult();
        List<ObjectError> errorList = bindingResult.getAllErrors();
        StringBuilder errorMessage = new StringBuilder();

        HttpStatus httpStatus = HttpStatus.resolve(status.value());

        for (ObjectError objectError : errorList) {
            if (objectError instanceof FieldError fieldError) {
                errorMessage.append(fieldError.getField())
                        .append(": ")
                        .append(fieldError.getDefaultMessage())
                        .append(". ");
            } else {
                errorMessage.append(objectError.getDefaultMessage()).append(". ");
            }
        }

        ApiError apiError = new ApiError(
                errorMessage.toString(),
                httpStatus,
                LocalDateTime.now()
        );

        return new ResponseEntity<>(apiError, httpStatus);
    }

}
