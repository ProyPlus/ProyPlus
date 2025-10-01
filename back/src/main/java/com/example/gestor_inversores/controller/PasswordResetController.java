package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.PasswordResetRequestDTO;
import com.example.gestor_inversores.dto.PasswordResetRequestEmailDTO;
import com.example.gestor_inversores.dto.PasswordResetResponseDTO;
import com.example.gestor_inversores.service.auth.IPasswordResetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private IPasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<PasswordResetResponseDTO> forgotPassword(
            @RequestBody @Valid PasswordResetRequestEmailDTO request) {
        passwordResetService.createPasswordResetToken(request.getEmail());
        return ResponseEntity.ok(new PasswordResetResponseDTO(
                "Instrucciones para restablecer la contraseña enviadas al correo."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<PasswordResetResponseDTO> resetPassword(
            @RequestBody @Valid PasswordResetRequestDTO request) {
        passwordResetService.resetPassword(request.getToken(), request.getPassword());
        return ResponseEntity.ok(new PasswordResetResponseDTO("Contraseña restablecida exitosamente."));
    }

}
