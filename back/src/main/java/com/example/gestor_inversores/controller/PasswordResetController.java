package com.example.gestor_inversores.controller;

import com.example.gestor_inversores.dto.PasswordResetRequestDTO;
import com.example.gestor_inversores.service.auth.IPasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private IPasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody PasswordResetRequestDTO request) {
        return passwordResetService.createPasswordResetToken(request.getEmail());
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody PasswordResetRequestDTO request) {
        return passwordResetService.resetPassword(request.getToken(), request.getPassword());
    }
}
