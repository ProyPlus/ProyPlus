package com.example.gestor_inversores.service.auth;

import com.example.gestor_inversores.exception.*;
import com.example.gestor_inversores.model.PasswordResetToken;
import com.example.gestor_inversores.model.User;
import com.example.gestor_inversores.repository.IPasswordResetTokenRepository;
import com.example.gestor_inversores.repository.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class PasswordResetService implements IPasswordResetService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IPasswordResetTokenRepository tokenRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EmailNotFoundException("No se encontró un usuario con ese correo."));

        // Eliminar tokens anteriores del usuario
        tokenRepository.deleteByUserId(user.getId());

        // Token súper único: userId + timestamp + UUID
        String token = Base64.getUrlEncoder().encodeToString(
                (user.getId() + "-" + System.currentTimeMillis() + "-" + UUID.randomUUID()).getBytes()
        );

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));

        // Guardar token en DB
        try {
            tokenRepository.save(resetToken);
        } catch (DataIntegrityViolationException ex) {
            throw new InvalidTokenException("Error generando token único, intenta de nuevo.");
        }

        // Enviar correo solo si el token se guardó correctamente
        try {
            sendPasswordResetEmail(user, resetToken.getToken());
        } catch (Exception ex) {
            throw new EmailSendException("Error al enviar el correo: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token);
        if (resetToken == null) throw new InvalidTokenException("Token inválido.");

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new ExpiredTokenException("El token ha expirado. Por favor, solicita uno nuevo.");
        }

        if (newPassword.length() < 6)
            throw new InvalidPasswordException("La contraseña debe tener al menos 6 caracteres.");

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
    }

    private void sendPasswordResetEmail(User user, String token) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(user.getEmail());
        email.setSubject("Restablecer Contraseña");
        email.setText("Para restablecer tu contraseña, haz clic en el siguiente enlace: \n"
                + "http://localhost:8080/reset-password?token=" + token); // reemplazar por URL de frontend
        mailSender.send(email);
    }
}
