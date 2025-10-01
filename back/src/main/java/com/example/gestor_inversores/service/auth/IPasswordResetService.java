package com.example.gestor_inversores.service.auth;

public interface IPasswordResetService {

    void createPasswordResetToken(String email);
    void resetPassword(String token, String newPassword);

}
