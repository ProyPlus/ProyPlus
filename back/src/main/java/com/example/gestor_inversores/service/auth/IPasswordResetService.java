package com.example.gestor_inversores.service.auth;

public interface IPasswordResetService {
    String createPasswordResetToken(String email);
    String resetPassword(String token, String newPassword);

}
